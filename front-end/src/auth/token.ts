export function getGoogleIdToken(): string | null {
  return localStorage.getItem("google_id_token");
}