import axios from "axios";
import { toast } from "sonner";

// in production, there's no localhost so we have to make this dynamic
const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000/"
    : "https://api.aerisgo.in/";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important for cookies
});

// Global response error handling
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;
    if (status === 401 || status === 403) {
      if (typeof window !== "undefined") {
        const current = window.location.pathname;
        if (current === "/sign-in") {
          return Promise.reject(error);
        }
        toast.error(message || "Session expired. Please sign in again.");
        if (current !== "/sign-in") {
          window.location.assign("/sign-in");
        }
      } else {
        toast.error(message || "Session expired. Please sign in again.");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
