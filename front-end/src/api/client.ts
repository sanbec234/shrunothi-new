
// import axios from "axios";

// export const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,
//   headers: { "Content-Type": "application/json" },
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("google_id_token");
//   if (token) {
//     config.headers = config.headers ?? {};
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

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
      // 🔑 Session expired or invalid token
      localStorage.removeItem("google_id_token");
      localStorage.removeItem("authUser");

      // Optional: store a flag for UI messaging
      sessionStorage.setItem("session_expired", "true");

      // Reload or redirect to login
      window.location.reload();
    }

    return Promise.reject(error);
  }
);
