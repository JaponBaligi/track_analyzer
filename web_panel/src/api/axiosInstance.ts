// web_panel/src/api/axiosInstance.ts

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api",
  timeout: 600000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token'ı otomatik ekle
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosInstance;

