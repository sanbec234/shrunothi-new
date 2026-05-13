const STORAGE_KEY = "session_token";

export function setGoogleIdToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function getGoogleIdToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearGoogleIdToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hadActiveSession(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
