import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to automatically attach JWT token and Simulated Reference Date
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sd_digitals_crm_token') || sessionStorage.getItem('sd_digitals_crm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach simulated reference date if configured
    const simulatedDate = localStorage.getItem('sd_digitals_reference_date');
    if (simulatedDate) {
      config.headers['X-Reference-Date'] = simulatedDate;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to capture token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Unauthorized or session expired
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('sd_digitals_crm_token');
        localStorage.removeItem('sd_digitals_crm_user');
        sessionStorage.removeItem('sd_digitals_crm_token');
        sessionStorage.removeItem('sd_digitals_crm_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
