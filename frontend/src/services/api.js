import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Remove trailing slash if it exists to prevent double slashes in requests
if (API_BASE_URL.endsWith('/')) {
    API_BASE_URL = API_BASE_URL.slice(0, -1);
}

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export { API_BASE_URL };

// Add auth token to requests if available
api.interceptors.request.use((config) => {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== "null" && userStr !== "undefined") {
        try {
            const user = JSON.parse(userStr);
            if (user && user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        } catch (e) {
            localStorage.removeItem('user');
        }
    }
    return config;
});

// Handle global responses (like 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Unauthorized access - clearing session");
            localStorage.removeItem('user');
            // Optional: window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;
