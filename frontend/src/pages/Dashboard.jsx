import React, { useState, useEffect, useRef } from 'react';
import { postMessage } from '../api';
import { Send, Terminal, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import GlowCard from '../components/GlowCard';

const POST_TYPES = [
    "Suno link",
    "Playlist link",
    "YouTube link",
    "Spotify link",
    "SoundCloud link",
    "Instagram link",
    "Twitter link",
    "Facebook link",
    "TikTok link",
    "Riffusion link"
];

const Dashboard = () => {
    const [message, setMessage] = useState('');
    const [postType, setPostType] = useState('Suno link');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const logsEndRef = useRef(null);

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:5000/api/logs');
        eventSource.onmessage = (event) => {
            const log = JSON.parse(event.data);
            setLogs(prev => [...prev, log]);
        };
        return () => eventSource.close();
    }, []);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const handlePost = async () => {
        if (!message.trim()) return;
        setLoading(true);
        setLogs(prev => [...prev, { message: "🚀 Sending job to backend...", type: "info", timestamp: new Date().toISOString() }]);
        try {
            await postMessage(message, postType);
            setLogs(prev => [...prev, { message: "✅ Job accepted by backend.", type: "success", timestamp: new Date().toISOString() }]);
        } catch (err) {
            setLogs(prev => [...prev, { message: `❌ Error: ${err.message}`, type: "error", timestamp: new Date().toISOString() }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-160px)]">
            {/* Left Column: Controls */}
            <div className="lg:col-span-7 flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-6xl font-black mb-2 tracking-tighter bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                        TRANSMISSION
                    </h1>
                    <p className="text-gray-400 mb-8 text-lg font-light tracking-wide">
                        Broadcast your frequency across the digital void.
                    </p>
                </motion.div>

                <GlowCard className="p-8">
                    <div className="space-y-6">
                        <div className="relative group">
                            <label className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block">Signal Type</label>
                            <select
                                value={postType}
                                onChange={(e) => setPostType(e.target.value)}
                                className="w-full bg-black/50 border-b-2 border-white/10 text-xl py-3 px-4 text-white outline-none focus:border-primary transition-all appearance-none cursor-pointer hover:bg-white/5"
                            >
                                {POST_TYPES.map(type => (
                                    <option key={type} value={type} className="bg-slate-900">{type}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-[38px] pointer-events-none text-primary">
                                <Sparkles className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="text-xs font-bold text-secondary uppercase tracking-widest mb-2 block">Payload</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter your message sequence..."
                                className="w-full h-40 bg-black/50 border-b-2 border-white/10 p-4 text-lg text-white outline-none focus:border-secondary transition-all resize-none hover:bg-white/5 placeholder:text-white/20"
                            />
                            {/* Corner accents */}
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20" />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePost}
                            disabled={loading || !message.trim()}
                            className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest flex items-center justify-center space-x-3 transition-all relative overflow-hidden group ${loading || !message.trim()
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-white text-black hover:bg-primary hover:text-white cursor-pointer'
                                }`}
                        >
                            {/* Button Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                            {loading ? (
                                <Zap className="w-5 h-5 animate-pulse" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                            <span>{loading ? 'Transmitting...' : 'Initiate Sequence'}</span>
                        </motion.button>
                    </div>
                </GlowCard>
            </div>

            {/* Right Column: Terminal */}
            <div className="lg:col-span-5 flex flex-col h-full">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="h-full"
                >
                    <div className="h-full bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-1 shadow-2xl flex flex-col overflow-hidden relative">
                        {/* Terminal Header */}
                        <div className="bg-white/5 p-3 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                                <Terminal className="w-3 h-3" />
                                <span>SYSTEM_LOGS.sh</span>
                            </div>
                        </div>

                        {/* Terminal Content */}
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 custom-scrollbar">
                            {logs.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                                    <div className="w-16 h-16 rounded-full border-2 border-gray-700 border-t-primary animate-spin" />
                                    <p className="animate-pulse">Awaiting Signal...</p>
                                </div>
                            )}
                            {logs.map((log, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex gap-3 ${log.type === 'error' ? 'text-red-400' :
                                        log.type === 'warning' ? 'text-yellow-400' :
                                            log.type === 'success' ? 'text-green-400' :
                                                'text-blue-300'
                                        }`}
                                >
                                    <span className="opacity-30 select-none">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                    </span>
                                    <span className="break-all">
                                        <span className="mr-2 opacity-50">{'>'}</span>
                                        {log.message}
                                    </span>
                                </motion.div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>

                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20" />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
