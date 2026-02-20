import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
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
