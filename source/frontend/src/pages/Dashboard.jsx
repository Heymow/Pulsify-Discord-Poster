import React, { useState, useEffect, useRef } from 'react';
import { postMessage, uploadFiles, getChannels } from '../api';
import { Send, Terminal, Sparkles, Zap, Paperclip, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowCard from '../components/GlowCard';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';

const Dashboard = () => {
    const { isConnected, triggerAuthAlert } = useAuth();
    const { message, setMessage, postType, setPostType, logs, setLogs } = useDashboard();
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [availableTypes, setAvailableTypes] = useState([]);
    const fileInputRef = useRef(null);
    const logsEndRef = useRef(null);

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const channelsData = await getChannels();
                const types = Object.keys(channelsData).filter(type => type !== 'everyone');
                setAvailableTypes(types);
                // If current postType is not in the list (and list is not empty), default to first one
                if (types.length > 0 && !types.includes(postType)) {
                    setPostType(types[0]);
                }
            } catch (error) {
                console.error("Failed to fetch channel types", error);
            }
        };

        fetchTypes();

        const eventSource = new EventSource('http://localhost:5000/api/logs');
        eventSource.onmessage = (event) => {
            const log = JSON.parse(event.data);

            // Clean up log message
            let cleanMessage = log.message
                .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}]/gu, '') // Remove emojis
                .replace(/Brain/g, 'Central') // Rename Brain
                .replace(/Identity:.*Verifying.*/, 'Verifying Identity...')
                .replace(/Requesting instructions.*/, 'Requesting Orders...')
                .trim();

            // Filter out technical/redundant logs
            if (
                cleanMessage.includes('Payload:') ||
                cleanMessage.includes('Using API Key:') ||
                cleanMessage.includes('Job accepted') ||
                cleanMessage.includes('Queue processing complete') ||
                cleanMessage.includes('Processing job')
            ) {
                return;
            }

            setLogs(prev => {
                const lasts = prev.slice(-3); // Check last 3 logs
                // Avoid adjacent duplicates
                if (lasts.some(l => l.message === cleanMessage && (new Date() - new Date(l.timestamp) < 2000))) {
                    return prev;
                }
                return [...prev, { ...log, message: cleanMessage }];
            });
        };
        return () => eventSource.close();
    }, []);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = [];
        const maxFileSize = 10 * 1024 * 1024; // 10MB

        if (files.length + selectedFiles.length > 10) {
            setLogs(prev => [...prev, { message: "⚠️ Max 10 files allowed.", type: "warning", timestamp: new Date().toISOString() }]);
            return;
        }

        selectedFiles.forEach(file => {
            if (file.size > maxFileSize) {
                setLogs(prev => [...prev, { message: `⚠️ File ${file.name} exceeds 10MB limit.`, type: "warning", timestamp: new Date().toISOString() }]);
            } else {
                validFiles.push(file);
            }
        });

        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handlePost = async () => {
        if (!message.trim() && files.length === 0) return;

        if (!isConnected) {
            triggerAuthAlert();
            setLogs(prev => [...prev, { message: "⚠️ Authentication required. Please connect your Discord account in Settings.", type: "warning", timestamp: new Date().toISOString() }]);
            return;
        }

        setLoading(true);
        setLogs(prev => [...prev, { message: "🚀 Sending job to backend...", type: "info", timestamp: new Date().toISOString() }]);

        try {
            let uploadedAttachments = [];
            if (files.length > 0) {
                setLogs(prev => [...prev, { message: `Uploading ${files.length} files...`, type: "info", timestamp: new Date().toISOString() }]);
                const uploadResult = await uploadFiles(files);
                uploadedAttachments = uploadResult.files;
                setLogs(prev => [...prev, { message: "✅ Files uploaded successfully.", type: "success", timestamp: new Date().toISOString() }]);
            }

            await postMessage(message, postType, uploadedAttachments);
            setLogs(prev => [...prev, { message: "✅ Job accepted by backend.", type: "success", timestamp: new Date().toISOString() }]);
            setFiles([]); // Clear files after success
            setMessage(""); // Optional: clear message too? User might want to keep it. Let's keep it for now or clear it? 
            // Usually we clear it. But let's stick to previous behavior for message (it wasn't cleared before).
            // Wait, looking at previous code: `setMessage` was NOT called in `handlePost`.
            // So I won't clear it either.
        } catch (err) {
            setLogs(prev => [...prev, { message: `❌ Error: ${err.message}`, type: "error", timestamp: new Date().toISOString() }]);
        } finally {
            setLoading(false);
        }
    };

    const formatLogMessage = (message) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = message.split(urlRegex);

        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline cursor-pointer"
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
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
                    <h1 className="text-4xl md:text-6xl font-black mb-2 tracking-tighter bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                        TRANSMISSION
                    </h1>
                    <p className="text-gray-400 mb-8 text-lg font-light tracking-wide">
                        Broadcast your frequency across the digital realm.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <GlowCard className="p-8">
                        <div className="space-y-6">
                            <div className="relative group">
                                <label className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block">Signal Type</label>
                                <select
                                    value={postType}
                                    onChange={(e) => setPostType(e.target.value)}
                                    className="w-full bg-black/50 border-b-2 border-white/10 text-xl py-3 px-4 text-white outline-none focus:border-primary transition-all appearance-none cursor-pointer hover:bg-white/5"
                                >
                                    {availableTypes.map(type => (
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
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20" />
                            </div>

                            {/* File Attachments */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider group cursor-pointer"
                                    >
                                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                            <Paperclip className="w-4 h-4" />
                                        </div>
                                        <span>Attach Files ({files.length}/10)</span>
                                    </button>
                                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">
                                        Max 10MB per file
                                    </span>
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    multiple
                                    className="hidden"
                                />

                                <AnimatePresence>
                                    {files.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="grid grid-cols-1 gap-2"
                                        >
                                            {files.map((file, index) => (
                                                <motion.div
                                                    key={`${file.name}-${index}`}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 group hover:border-white/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <FileText className="w-4 h-4 text-secondary shrink-0" />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm text-gray-300 truncate font-medium">{file.name}</span>
                                                            <span className="text-[10px] text-gray-500 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(index)}
                                                        className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handlePost}
                                disabled={loading || (!message.trim() && files.length === 0)}
                                className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest flex items-center justify-center space-x-3 transition-all relative overflow-hidden group ${loading || (!message.trim() && files.length === 0)
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
                </motion.div>
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
                                        {formatLogMessage(log.message)}
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
