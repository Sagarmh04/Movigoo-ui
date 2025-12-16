import axios from "axios";

// Use local Next.js API routes only - no external URLs
const api = axios.create({
  baseURL: "", // Empty baseURL means relative to current domain
  timeout: 12000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "We couldn't complete your request. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default api;

