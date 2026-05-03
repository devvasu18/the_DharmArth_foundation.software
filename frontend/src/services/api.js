import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Remove trailing slash if it exists to prevent double slashes in requests
if (API_BASE_URL.endsWith('/')) {
    API_BASE_URL = API_BASE_URL.slice(0, -1);
}

console.log(`[API] Connected to Backend: ${API_BASE_URL}`);
console.log(`[API] WhatsApp Gateway: ${import.meta.env.VITE_WHATSAPP_SERVICE_URL || 'Local (10000)'}`);

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach token to every request for incognito/third-party cookie fallback
api.interceptors.request.use(
    (config) => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const { token } = JSON.parse(storedUser);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (e) {
                console.error("Error parsing stored user for token", e);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export { API_BASE_URL };


// Handle global responses (like 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Session expired or unauthorized - clearing local user state");
            localStorage.removeItem('user');
            // Do NOT redirect globally here, as public pages (like /donate) 
            // might trigger 401s when checking for a session.
            // ProtectedRoute.jsx will handle redirection for guarded routes.
        }
        return Promise.reject(error);
    }
);

export default api;
