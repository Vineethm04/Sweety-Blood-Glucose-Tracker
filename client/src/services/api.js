import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach the saved JWT token to protected requests
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("sweety_token") ||
      sessionStorage.getItem("sweety_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication API functions
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),

  login: (credentials) => api.post("/auth/login", credentials),

  getMe: () => api.get("/auth/me")
};

// Glucose reading API functions
export const readingAPI = {
  getAll: () => api.get("/readings"),

  getById: (id) => api.get(`/readings/${id}`),

  create: (readingData) => api.post("/readings", readingData),

  update: (id, readingData) =>
    api.put(`/readings/${id}`, readingData),

  delete: (id) => api.delete(`/readings/${id}`)
};

export default api;
