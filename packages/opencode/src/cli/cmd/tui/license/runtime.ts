// [F-license-desktop] Runtime de licence : heartbeat 30 min en arriere-plan,
// + canaris d'integrite a intervalles aleatoires.
//
// Demarre apres l'activation reussie, s'arrete a la sortie du TUI.

import { pingLicense, reportIntegrity, saveLicenseState } from "./license"
import type { LicenseState } from "./license"
import {
  computeBinaryHash,
  detectDebuggerAttached,
  detectReverseEngineeringTools,
  detectSandbox,
} from "./integrity"

const HEARTBEAT_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes
const INTEGRITY_INTERVAL_MS = 12 * 60 * 1000 // 12 minutes

let _heartbeat_timer: ReturnType<typeof setInterval> | undefined
let _integrity_timer: ReturnType<typeof setInterval> | undefined
let _current_state: LicenseState | undefined
let _on_revoked: ((reason: string) => void) | undefined
let _binary_hash: string | undefined

export function startLicenseRuntime(
  state: LicenseState,
  options: {
    onRevoked: (reason: string) => void
    binaryHash?: string
  },
): void {
  stopLicenseRuntime()
  _current_state = state
  _on_revoked = options.onRevoked
  _binary_hash = options.binaryHash ?? computeBinaryHash()

  _heartbeat_timer = setInterval(runHeartbeat, HEARTBEAT_INTERVAL_MS)
  _integrity_timer = setInterval(runIntegrityScan, INTEGRITY_INTERVAL_MS)

  // Premier scan immediat (sans attendre l'intervalle).
  setTimeout(() => runIntegrityScan(), 5_000)
  setTimeout(() => runHeartbeat(), 60_000)
}

export function stopLicenseRuntime(): void {
  if (_heartbeat_timer) clearInterval(_heartbeat_timer)
  if (_integrity_timer) clearInterval(_integrity_timer)
  _heartbeat_timer = undefined
  _integrity_timer = undefined
  _current_state = undefined
}

async function runHeartbeat(): Promise<void> {
  if (!_current_state || !_on_revoked) return
  const result = await pingLicense(_current_state, _binary_hash)
  if (result.status === "revoked" || result.status === "expired") {
    _on_revoked(result.message ?? "license " + result.status)
    stopLicenseRuntime()
    return
  }
  if (result.refreshed) {
    // Le state a deja ete reecrit cote license.ts ; on ne fait que mettre
    // a jour la reference en memoire.
    const fresh = _current_state
    _current_state = { ...fresh }
  }
}

async function runIntegrityScan(): Promise<void> {
  if (!_current_state) return
  // Hash binaire — si different de celui d'au demarrage, alerte critique.
  const current_hash = computeBinaryHash()
  if (_binary_hash && current_hash && current_hash !== _binary_hash) {
    await reportIntegrity(_current_state, "binary_hash_mismatch", "critical", {
      observed: current_hash,
      expected: _binary_hash,
    })
  }

  // Debugger attache.
  if (detectDebuggerAttached()) {
    await reportIntegrity(_current_state, "debugger_attached", "warn", {})
  }

  // Outils de RE actifs.
  const re = detectReverseEngineeringTools()
  if (re.length > 0) {
    await reportIntegrity(_current_state, "re_tool_detected", "critical", { tools: re })
  }

  // Sandbox / VM analysis.
  const sb = detectSandbox()
  if (sb.suspect) {
    await reportIntegrity(_current_state, "sandbox_detected", "info", sb.signals)
  }
}

export function reportHoneypotAccess(token_state: LicenseState | undefined, asset: string): void {
  if (!token_state) return
  // Fire and forget — un acces a un honeypot signale un attaquant.
  void reportIntegrity(token_state, "honeypot_access", "critical", { asset })
}
