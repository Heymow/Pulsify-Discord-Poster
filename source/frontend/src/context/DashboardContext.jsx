import React, { createContext, useState, useContext } from 'react';

const DashboardContext = createContext();

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }) => {
    const [message, setMessage] = useState('');
    const [postType, setPostType] = useState('Suno link');
    const [logs, setLogs] = useState([]);

    return (
        <DashboardContext.Provider value={{
            message,
            setMessage,
            postType,
            setPostType,
            logs,
            setLogs
        }}>
            {children}
        </DashboardContext.Provider>
    );
};
