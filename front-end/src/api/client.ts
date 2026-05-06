import axios from "axios";
import { getGoogleIdToken, clearGoogleIdToken } from "../auth/token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

function isStoredTokenExpired(): boolean {
  const token = getGoogleIdToken();
  if (!token) return true;

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return true;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalized)) as { exp?: unknown };
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    if (!exp) return true;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

function isTokenErrorMessage(raw: unknown): boolean {
  const msg = String(raw || "").toLowerCase();
  return msg.includes("expired") || msg.includes("invalid token");
}

api.interceptors.request.use((config) => {
  const token = getGoogleIdToken();
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
        clearGoogleIdToken();
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
