import axios from 'axios';

// Create an axios instance
const api = axios.create({
  // Default to backend service port 9999 when env is not provided
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9999',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      console.warn('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

export default api;
