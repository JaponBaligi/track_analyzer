// web_panel/src/api/axiosInstance.ts

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api",
  timeout: 600000,// 10 minutes timeout
  headers: {
    "Content-Type": "application/json"
  }
});

export default axiosInstance;
