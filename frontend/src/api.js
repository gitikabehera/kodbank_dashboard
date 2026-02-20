import axios from 'axios';

const API_URL = import.meta.env.PROD
    ? 'https://kodbank-backend-suxm.onrender.com/api'
    : 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);

        // Auto Logout on 401 (JWT Expired or Invalid)
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '/login?expired=true';
        }

        const message = error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(message);
    }
);

export default api;
