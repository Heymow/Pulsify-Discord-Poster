import React, { useState, useEffect } from 'react';
import { triggerDiscordLogin, logout, getSettings, saveSettings } from '../api';
import { LogIn, LogOut, CheckCircle, AlertCircle, Loader2, Shield, Key, Save, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import GlowCard from '../components/GlowCard';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { isConnected, setIsConnected, verifySession } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    // Brain Key State
    const [brainKey, setBrainKey] = useState('');
    const [discordId, setDiscordId] = useState('');
    const [keyLoading, setKeyLoading] = useState(false);
    const [keyStatus, setKeyStatus] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await getSettings();
            setBrainKey(data.brainApiKey || '');
            setDiscordId(data.discordPosterId || '');
        } catch (err) {
            console.error("Failed to load settings", err);
        }
    };

    const handleSaveKey = async () => {
        // Allow saving if either key or id is provided, ideally both
        setKeyLoading(true);
        setKeyStatus(null);
        try {
            await saveSettings({
                brainApiKey: brainKey,
                discordPosterId: discordId
            });
            setKeyStatus({ type: 'success', message: 'Settings Saved' });
            setTimeout(() => setKeyStatus(null), 3000);
            fetchSettings(); // Refresh
        } catch (err) {
            console.error("Failed to save settings", err);
            setKeyStatus({ type: 'error', message: 'Failed to save' });
        } finally {
            setKeyLoading(false);
        }
    };

    const handleLogin = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const res = await triggerDiscordLogin();
            setStatus({ type: 'success', message: res.message || 'Session saved!' });
            setIsConnected(true);
            await verifySession(); // Double check with backend
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
        } catch {
            setStatus({ type: 'error', message: 'Logout failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] pb-20">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg mb-8"
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
                                    <li className="pl-0">Encrypted local storage<br /><span className="text-xs opacity-70 ml-4">(Privacy: stored only on your machine)</span></li>
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

            {/* Brain API Key Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full max-w-lg"
            >
                <GlowCard className="p-8 border-t-4 border-purple-500">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                            <Brain className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">BRAIN CONNECTION</h2>
                            <p className="text-sm text-gray-400">Configure connection to the central intelligence.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Discord User ID</label>
                            <input
                                type="text"
                                value={discordId}
                                onChange={(e) => setDiscordId(e.target.value)}
                                placeholder="Enter Discord ID"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm"
                            />
                            <p className="text-xs text-gray-600">
                                This ID must match the one linked to your API Key in the Dashboard.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Brain API Key</label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={brainKey}
                                    onChange={(e) => setBrainKey(e.target.value)}
                                    placeholder="Enter API Key"
                                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm"
                                />
                                <button
                                    onClick={handleSaveKey}
                                    disabled={keyLoading}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] cursor-pointer"
                                >
                                    {keyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SAVE'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                This key authenticates you with the central brain server to receive task instructions.
                            </p>
                        </div>

                        {/* Concurrency Settings moved here */}
                        <div className="pt-4 border-t border-white/5 mt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-300 text-sm font-bold">Concurrent Tabs</p>
                                    <p className="text-gray-500 text-xs">Simultaneous browser tabs (1-5)</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        defaultValue="3"
                                        className="w-16 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-center outline-none focus:border-purple-500 appearance-none"
                                        onChange={async (e) => {
                                            const val = parseInt(e.target.value);
                                            if (val >= 1 && val <= 5) {
                                                try {
                                                    await fetch('http://localhost:5000/discord/concurrency', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ concurrency: val })
                                                    });
                                                } catch (err) {
                                                    console.error("Failed to update concurrency", err);
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-gray-500">
                                <span className="text-green-400 font-bold">1 (Safe)</span>: Human-like behavior, less detection risk.<br />
                                <span className="text-yellow-400 font-bold">3+ (Fast)</span>: Higher throughput, higher CPU usage.
                            </p>
                        </div>

                        {keyStatus && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`text-center text-sm font-bold ${keyStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
                                    }`}
                            >
                                {keyStatus.message}
                            </motion.div>
                        )}
                    </div>
                </GlowCard>
            </motion.div>
        </div>
    );
};

export default Settings;
