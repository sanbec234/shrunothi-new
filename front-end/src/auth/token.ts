const STORAGE_KEY = "gid_token";

export function setGoogleIdToken(token: string): void {
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function getGoogleIdToken(): string | null {
  const token = sessionStorage.getItem(STORAGE_KEY);
  if (!token) return null;
  if (isExpired(token)) {
    clearGoogleIdToken();
    return null;
  }
  return token;
}

export function clearGoogleIdToken(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function hadActiveSession(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) !== null;
}

function isExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
    const { exp } = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof exp !== "number") return true;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}
