import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, Settings, Music, Disc, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Background from './Background';
import { checkSession } from '../api';

const Layout = ({ children }) => {
    const location = useLocation();
    const [isConnected, setIsConnected] = useState(true); // Default to true to avoid flash
    const [showAuthAlert, setShowAuthAlert] = useState(false);

    useEffect(() => {
        const verifySession = async () => {
            try {
                const res = await checkSession();
                setIsConnected(res.connected);
                if (!res.connected) {
                    setShowAuthAlert(true);
                }
            } catch (err) {
                console.error("Session check failed", err);
                setIsConnected(false);
                setShowAuthAlert(true);
            }
        };
        verifySession();
    }, [location.pathname]); // Re-check on navigation

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/channels', label: 'Channels', icon: List },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen text-white font-sans selection:bg-primary/30">
            <Background />

            {/* Top Navigation Bar (Floating Glass) */}
            <div className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
                <nav className="pointer-events-auto w-full max-w-[95vw] md:w-max flex flex-col items-center gap-2">

                    {/* Auth Alert Banner */}
                    <AnimatePresence>
                        {showAuthAlert && !isConnected && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wide cursor-pointer hover:bg-red-600 transition-colors"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                <span>Authentication Required for Posting</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between md:justify-start gap-2 p-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-x-auto no-scrollbar">
                        <div className="pl-4 pr-6 flex items-center gap-3 border-r border-white/10 mr-2 shrink-0">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary blur-md opacity-50 animate-pulse" />
                                <Disc className="w-6 h-6 text-white relative z-10 animate-[spin_3s_linear_infinite]" />
                            </div>
                            <span className="font-bold tracking-wider text-xs sm:text-sm uppercase block whitespace-nowrap">
                                <span className="animate-gradient-x bg-gradient-to-r from-blue-500 via-red-500 to-blue-500 bg-clip-text text-transparent">Pulsify</span>
                                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"> Discord Poster</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                const isSettings = item.path === '/settings';
                                const needsAttention = isSettings && !isConnected;

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`relative px-4 h-9 rounded-full transition-all duration-300 group cursor-pointer flex items-center justify-center ${needsAttention ? 'animate-pulse border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : ''}`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-pill"
                                                className="absolute inset-0 bg-white/10 rounded-full"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <div className={`relative flex items-center gap-2 z-10 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'} ${needsAttention ? 'text-red-400' : ''}`}>
                                            <Icon className="w-4 h-4" />
                                            <span className="text-sm font-medium hidden sm:block">{item.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </nav>
            </div>

            {/* Main Content Area */}
            <main className="pt-32 pb-12 px-6 max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20, transition: { duration: 0.1 } }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Layout;
