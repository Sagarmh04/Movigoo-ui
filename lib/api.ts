import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.movigoo.dev",
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
      "We couldn’t complete your request. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default api;

