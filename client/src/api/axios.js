import axios from "axios";

// In dev, Vite proxy handles /api → localhost:5000
// In production, VITE_API_URL env var points to the deployed backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
