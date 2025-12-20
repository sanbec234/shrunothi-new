import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});
