import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/users/profile');
            setUser(data);
            
            // CRITICAL: Preserve the token for Incognito sessions
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed.token) {
                    localStorage.setItem('user', JSON.stringify({ ...data, token: parsed.token }));
                } else {
                    localStorage.setItem('user', JSON.stringify(data));
                }
            } else {
                localStorage.setItem('user', JSON.stringify(data));
            }
        } catch (err) {
            setUser(null);
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check if there is an auth token in the URL query string (Magic Link/Auto-Login)
        const urlParams = new URLSearchParams(window.location.search);
        const authToken = urlParams.get('authToken');
        
        if (authToken) {
            // Save token to localStorage to trigger auto-login
            localStorage.setItem('user', JSON.stringify({ token: authToken }));
            
            // Clean up the authToken from the URL query string to keep the URL clean & secure
            urlParams.delete('authToken');
            const newSearch = urlParams.toString();
            const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
            window.history.replaceState({}, document.title, newUrl);
        }

        // Initial load: check localStorage for optimistic UI, then verify with server
        const storedUser = localStorage.getItem('user');
        if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
        fetchProfile();
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = async () => {
        try {
            await api.get('/auth/logout');
        } catch (err) {
            console.error("Logout failed on server", err);
        }
        setUser(null);
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, setUser, login, logout, refreshUser: fetchProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
