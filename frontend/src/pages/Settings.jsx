import React, { useState } from 'react';
import { checkSession, logout, triggerDiscordLogin } from '../api';
import { LogIn, LogOut, CheckCircle, AlertCircle, Loader2, Shield, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import GlowCard from '../components/GlowCard';

const Settings = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    const [isConnected, setIsConnected] = useState(false);

    React.useEffect(() => {
        checkSessionStatus();
    }, []);

    const checkSessionStatus = async () => {
        const res = await checkSession();
        setIsConnected(res.connected);
    };

    const handleLogin = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const res = await triggerDiscordLogin();
            setStatus({ type: 'success', message: res.message || 'Session saved!' });
            setIsConnected(true);
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Login failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            setIsConnected(false);
            setStatus({ type: 'success', message: 'Disconnected successfully' });
        } catch (err) {
            setStatus({ type: 'error', message: 'Logout failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg"
            >
                <GlowCard className="p-10">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                            <Shield className="w-10 h-10 text-primary relative z-10" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2">AUTHENTICATION</h2>
                        <p className="text-gray-400">Establish secure link with Discord Gateway.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-start gap-4">
                            <Key className="w-6 h-6 text-gray-500 mt-1" />
                            <div className="text-sm text-gray-400">
                                <p className="mb-2">Access token required for automated transmission.</p>
                                <ul className="list-disc list-inside space-y-1 opacity-70">
                                    <li>Opens secure browser window</li>
                                    <li>Captures session cookie</li>
                                    <li>Encrypted local storage</li>
                                </ul>
                            </div>
                        </div>

                        {isConnected ? (
                            <button
                                onClick={handleLogout}
                                disabled={loading}
                                className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest flex items-center justify-center space-x-3 transition-all shadow-xl ${loading
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-1 cursor-pointer'
                                    }`}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                                <span>{loading ? 'Disconnecting...' : 'Disconnect Account'}</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest flex items-center justify-center space-x-3 transition-all shadow-xl ${loading
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-primary hover:bg-primary/90 text-white shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 cursor-pointer'
                                    }`}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                                <span>{loading ? 'Handshaking...' : 'Connect Account'}</span>
                            </button>
                        )}

                        {status && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex items-center justify-center space-x-2 p-4 rounded-xl border ${status.type === 'success'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}
                            >
                                {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="font-medium">{status.message}</span>
                            </motion.div>
                        )}

                        <div className="mt-6 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-xs text-yellow-500/70 text-center leading-relaxed">
                            <p className="font-bold mb-1">⚠️ DISCLAIMER</p>
                            Automating user accounts is against Discord's Terms of Service. Use at your own risk.
                            <br />
                            However, this tool has been running safely for <span className="text-yellow-400 font-bold">over 8 months</span>.
                        </div>
                    </div>
                </GlowCard>
            </motion.div>
        </div>
    );
};

export default Settings;
