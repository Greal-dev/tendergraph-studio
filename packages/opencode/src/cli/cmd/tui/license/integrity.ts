// [F-license-desktop] Stub minimal pour les sondes d'integrite runtime.
// Remplacer par l'implementation reelle (hash binaire, detection RE, sandbox).

export function computeBinaryHash(): string | undefined {
  return undefined
}

export function detectDebuggerAttached(): boolean {
  return false
}

export function detectReverseEngineeringTools(): string[] {
  return []
}

export function detectSandbox(): { suspect: boolean; signals: Record<string, unknown> } {
  return { suspect: false, signals: {} }
}
