// import axios from "axios";

// export const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,
//   headers: { "Content-Type": "application/json" },
//   // timeout: 10000,
// });

import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("google_id_token");

  // console.log(
  //   "[API REQUEST]",
  //   config.method?.toUpperCase(),
  //   config.url,
  //   "TOKEN:",
  //   token ? token.slice(0, 25) + "..." : "❌ NO TOKEN"
  // );

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});