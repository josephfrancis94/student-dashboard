import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('student-dashboard-token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const extractPayload = (response) => {
  const payload = response?.data;

  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if ('data' in payload) {
    return payload.data;
  }

  return payload;
};

export default api;
