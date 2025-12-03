import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, Settings, Music, Disc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Background from './Background';

const Layout = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/channels', label: 'Channels', icon: List },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen text-white font-sans selection:bg-primary/30">
            <Background />

            {/* Top Navigation Bar (Floating Glass) */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 p-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
                    <div className="pl-4 pr-6 flex items-center gap-3 border-r border-white/10 mr-2">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary blur-md opacity-50 animate-pulse" />
                            <Disc className="w-6 h-6 text-white relative z-10 animate-[spin_3s_linear_infinite]" />
                        </div>
                        <span className="font-bold tracking-wider text-sm uppercase bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Discord Poster
                        </span>
                    </div>

                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="relative px-4 py-2 rounded-full transition-all duration-300 group cursor-pointer"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-white/10 rounded-full"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <div className={`relative flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="pt-32 pb-12 px-6 max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Layout;
