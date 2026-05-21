import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { OneSignal } from 'react-native-onesignal';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/users/profile');
            setUser(data);
            if (data && data._id) {
                OneSignal.initialize(process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || '93331230-247c-47e7-9211-53b53d59332d');
                OneSignal.login(String(data._id));
            }
            
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed.token) {
                    await AsyncStorage.setItem('user', JSON.stringify({ ...data, token: parsed.token }));
                } else {
                    await AsyncStorage.setItem('user', JSON.stringify(data));
                }
            } else {
                await AsyncStorage.setItem('user', JSON.stringify(data));
            }
        } catch (err) {
            setUser(null);
            await AsyncStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadStoredUser = async () => {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    await AsyncStorage.removeItem('user');
                }
            }
            await fetchProfile();
        };
        loadStoredUser();
    }, []);

    const login = async (userData) => {
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        if (userData && userData._id) {
            OneSignal.initialize(process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || '93331230-247c-47e7-9211-53b53d59332d');
            OneSignal.login(String(userData._id));
        }
    };

    const logout = async () => {
        try {
            await api.get('/auth/logout');
        } catch (err) {
            console.error("Logout failed on server", err);
        }
        OneSignal.logout();
        setUser(null);
        await AsyncStorage.removeItem('user');
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
