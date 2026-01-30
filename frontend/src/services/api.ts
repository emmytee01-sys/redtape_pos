import axios from 'axios';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // In development, use proxy (from vite.config.ts)
  if (import.meta.env.DEV) {
    return '/api';
  }
  // In production, use the actual backend URL
  // You can also set this via environment variable: import.meta.env.VITE_API_URL
  return import.meta.env.VITE_API_URL || 'https://redtapepos.com.ng/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

