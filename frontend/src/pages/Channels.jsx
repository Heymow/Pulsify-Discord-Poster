import React, { useState, useEffect } from 'react';
import { getChannels, addChannel, removeChannel, toggleEveryone } from '../api';
import { Trash2, Plus, Hash, Volume2, Search, AlertCircle, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowCard from '../components/GlowCard';
import ExportModal from '../components/ExportModal';
import ImportModal from '../components/ImportModal';

const Channels = () => {
    const [channels, setChannels] = useState({});
    const [loading, setLoading] = useState(true);
    const [newUrl, setNewUrl] = useState('');
    const [newName, setNewName] = useState('');
    const [activeType, setActiveType] = useState('Suno link');
    const [search, setSearch] = useState('');
    const [showExport, setShowExport] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async () => {
        try {
            const data = await getChannels();
            setChannels(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newUrl) return;
        setError(null);

        // Validate URL format
        const discordRegex = /^https:\/\/discord\.com\/channels\/\d+\/\d+$/;
        if (!discordRegex.test(newUrl)) {
            setError("Invalid Discord Channel URL. Must be: https://discord.com/channels/GUILD_ID/CHANNEL_ID");
            setTimeout(() => setError(null), 5000);
            return;
        }

        try {
            const updated = await addChannel(activeType, newUrl, newName);
            setChannels(updated);
            setNewUrl('');
            setNewName('');
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data) {
                setError(err.response.data.error || "Failed to add channel");
                setTimeout(() => setError(null), 5000);
            }
        }
    };

    const handleRemove = async (type, url) => {
        if (!confirm('Are you sure?')) return;
        try {
            const updated = await removeChannel(type, url);
            setChannels(updated);
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleEveryone = async (url) => {
        try {
            const updated = await toggleEveryone(url);
            setChannels(updated);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const channelTypes = Object.keys(channels).filter(k => k !== 'everyone');
    const everyoneList = (channels.everyone || []).map(c => c.url);
    const currentList = channels[activeType] || [];
    const filteredList = currentList.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.url.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-end"
            >
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white mb-2">NETWORK</h1>
                    <p className="text-gray-400 font-light">Manage your transmission nodes.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowImport(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                        <Upload className="w-4 h-4" />
                        Import
                    </button>
                    <button
                        onClick={() => setShowExport(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </motion.div>

            <ExportModal
                isOpen={showExport}
                onClose={() => setShowExport(false)}
                channels={channels}
            />
            <ImportModal
                isOpen={showImport}
                onClose={() => setShowImport(false)}
                onImportSuccess={() => {
                    fetchChannels();
                    // Keep modal open to show results, user closes it manually
                }}
            />

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Types */}
                <div className="w-full lg:w-72 space-y-2">
                    {channelTypes.map((type, index) => (
                        <motion.button
                            key={type}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setActiveType(type)}
                            className={`w-full text-left px-6 py-4 rounded-xl flex items-center justify-between transition-all duration-300 relative overflow-hidden group ${activeType === type
                                ? 'bg-white text-black shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                } cursor-pointer`}
                        >
                            <span className="font-bold tracking-wide z-10">{type}</span>
                            <span className={`px-2 py-1 rounded-md text-xs font-mono z-10 ${activeType === type ? 'bg-black text-white' : 'bg-black/30'
                                }`}>
                                {channels[type]?.length || 0}
                            </span>

                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        </motion.button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6">
                    {/* Controls */}
                    <GlowCard className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search nodes..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                            <div className="flex-[2] flex gap-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Channel Name (optional)"
                                    className="w-1/3 bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                                />
                                <input
                                    type="text"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    placeholder="Channel URL..."
                                    className="flex-1 bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                                />
                                <button
                                    onClick={handleAdd}
                                    className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-bold flex items-center transition-colors shadow-lg hover:shadow-white/20 cursor-pointer"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                </div>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </motion.div>
                )}
            </GlowCard>

            {/* List */}
            <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                    {filteredList.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-gray-500 py-20 font-light"
                        >
                            No signals detected in this sector.
                        </motion.div>
                    )}

                    {filteredList.map((channel, index) => {
                        const isEveryone = everyoneList.includes(channel.url);
                        const hasFailures = channel.failures > 0;

                        return (
                            <motion.div
                                key={channel.url}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.03 }}
                                className={`group relative bg-white/5 hover:bg-white/10 border p-4 rounded-xl flex items-center justify-between transition-all backdrop-blur-sm ${hasFailures
                                    ? 'border-red-500/50 shadow-[0_0_15px_-5px_rgba(239,68,68,0.5)]'
                                    : 'border-white/5 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`p-2 rounded-lg ${isEveryone ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-800 text-gray-500'}`}>
                                        <Hash className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <div className="text-white font-bold truncate">
                                            {channel.name}
                                        </div>
                                        <div className="truncate text-xs text-gray-500 font-mono group-hover:text-gray-300 transition-colors">
                                            {channel.url}
                                        </div>
                                    </div>

                                    {hasFailures && (
                                        <div className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-bold rounded border border-red-500/30 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {channel.failures} failures
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                                    <button
                                        onClick={() => handleToggleEveryone(channel.url)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isEveryone
                                            ? 'bg-yellow-500 text-black shadow-[0_0_15px_-3px_rgba(234,179,8,0.5)]'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            } cursor-pointer`}
                                    >
                                        {isEveryone ? '@everyone' : 'Standard'}
                                    </button>

                                    <button
                                        onClick={() => handleRemove(activeType, channel.url)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div >
    );
};

export default Channels;
