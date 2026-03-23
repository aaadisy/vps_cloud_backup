
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('traum_admin_user'));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
