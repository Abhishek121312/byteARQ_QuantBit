import axios from 'axios';

// Get the backend URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This is crucial for sending/receiving cookies
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can add global error handling here, e.g., redirect to login on 401
    if (error.response && error.response.status === 401) {
      // Example: redirect to login if not already on login page
      if (window.location.pathname !== '/login') {
         // window.location.href = '/login';
         console.error("Authentication Error: 401 Unauthorized");
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;