import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your local machine IP if testing on a physical device
// For emulator, 10.0.2.2 is usually the localhost of the host machine
const API_BASE_URL = 'http://10.0.2.2:5000'; 

console.log(`[API] Connected to Backend: ${API_BASE_URL}`);

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach token to every request
api.interceptors.request.use(
    async (config) => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                const { token } = JSON.parse(storedUser);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (e) {
            console.error("Error retrieving stored user for token", e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle global responses (like 401)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.warn("Session expired or unauthorized - clearing local user state");
            await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

export { API_BASE_URL };
export default api;
