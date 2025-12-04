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
            // Hide alert after 5 seconds automatically? Or keep it until they go to settings?
            // User didn't specify, but auto-hide is nice. Let's keep it persistent until they click it or go to settings.
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
