// Token is held only in memory — never written to localStorage/sessionStorage.
// This prevents XSS scripts from stealing it via storage APIs.
// On page reload the user silently re-authenticates via Google One-Tap.
let _token: string | null = null;

export function setGoogleIdToken(token: string): void {
  _token = token;
  // Write a non-sensitive marker so the app knows a session was active
  // (used to show "reconnecting…" instead of the full login screen on reload).
  sessionStorage.setItem("session_active", "1");
}

export function getGoogleIdToken(): string | null {
  return _token;
}

export function clearGoogleIdToken(): void {
  _token = null;
  sessionStorage.removeItem("session_active");
}

export function hadActiveSession(): boolean {
  return sessionStorage.getItem("session_active") === "1";
}
