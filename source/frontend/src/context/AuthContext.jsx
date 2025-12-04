import React, { createContext, useState, useContext, useEffect } from 'react';
import { checkSession } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(true); // Default true to avoid flash
    const [showAuthAlert, setShowAuthAlert] = useState(false);

    const verifySession = async () => {
        try {
            const res = await checkSession();
            setIsConnected(res.connected);
            // We do NOT set showAuthAlert here anymore, as per user request
        } catch (err) {
            console.error("Session check failed", err);
            setIsConnected(false);
        }
    };

    useEffect(() => {
        verifySession();
    }, []);

    const triggerAuthAlert = () => {
        if (!isConnected) {
            setShowAuthAlert(true);
            // Auto-hide after 5 seconds
            setTimeout(() => {
                setShowAuthAlert(false);
            }, 5000);
        }
    };

    return (
        <AuthContext.Provider value={{
            isConnected,
            setIsConnected,
            showAuthAlert,
            setShowAuthAlert,
            verifySession,
            triggerAuthAlert
        }}>
            {children}
        </AuthContext.Provider>
    );
};
