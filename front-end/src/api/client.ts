import axios from "axios";
import { getGoogleIdToken, clearGoogleIdToken } from "../auth/token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

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
      const tokenGone = !getGoogleIdToken();
      const shouldLogout =
        tokenGone || isTokenErrorMessage(backendMessage);

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
