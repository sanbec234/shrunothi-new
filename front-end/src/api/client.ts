import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

function decodeTokenExpiry(token: string): number | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalized)) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isStoredTokenExpired(): boolean {
  const token = localStorage.getItem("google_id_token");
  if (!token) return true;

  const exp = decodeTokenExpiry(token);
  if (!exp) return true;

  return Date.now() >= exp * 1000;
}

function isTokenErrorMessage(raw: unknown): boolean {
  const msg = String(raw || "").toLowerCase();
  return msg.includes("expired") || msg.includes("invalid token");
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("google_id_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const backendMessage = error.response?.data?.error;
      const shouldLogout =
        isStoredTokenExpired() || isTokenErrorMessage(backendMessage);

      if (shouldLogout) {
        localStorage.removeItem("google_id_token");
        localStorage.removeItem("authUser");
        sessionStorage.setItem("session_expired", "true");
        window.location.reload();
      } else {
        console.error("[api] 401 received while token looks valid", {
          url: error.config?.url,
          method: error.config?.method,
          response: error.response?.data,
        });
      }
    }

    return Promise.reject(error);
  }
);
