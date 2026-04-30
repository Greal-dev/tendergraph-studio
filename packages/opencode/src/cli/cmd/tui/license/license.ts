// [F-license-desktop] Stub minimal pour le runtime de licence.
// Remplacer par l'implementation reelle quand le backend de licence est branche.

export interface LicenseState {
  token: string
  workspace_id: string
  user_id: string
  expires_at: number
  features: string[]
}

export interface PingResult {
  status: "active" | "revoked" | "expired"
  message?: string
  refreshed?: boolean
}

export async function pingLicense(_state: LicenseState, _binaryHash?: string): Promise<PingResult> {
  return { status: "active" }
}

export async function reportIntegrity(
  _state: LicenseState,
  _kind: string,
  _severity: "info" | "warn" | "critical",
  _details: Record<string, unknown>,
): Promise<void> {}

export async function saveLicenseState(_state: LicenseState): Promise<void> {}
