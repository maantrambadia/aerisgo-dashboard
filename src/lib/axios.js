import axios from "axios";

// in production, there's no localhost so we have to make this dynamic
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000/" : "/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important for cookies
});

export default api;