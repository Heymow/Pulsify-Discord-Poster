import React, { useState, useEffect } from 'react';
import { getChannels, addChannel, removeChannel, toggleEveryone, updateChannel, resetFailure } from '../api';
import { Trash2, Plus, Hash, Search, AlertCircle, Download, Upload, Pencil, Check, X, Settings as Cog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowCard from '../components/GlowCard';
import ExportModal from '../components/ExportModal';
import ImportModal from '../components/ImportModal';
import TypeManagerModal from '../components/TypeManagerModal';

const Channels = () => {
    const [channels, setChannels] = useState({});
    const [loading, setLoading] = useState(true);
    const [newUrl, setNewUrl] = useState('');
    const [newName, setNewName] = useState('');
    const [activeType, setActiveType] = useState('Suno link');
    const [search, setSearch] = useState('');
    const [showExport, setShowExport] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showTypeManager, setShowTypeManager] = useState(false);
    const [error, setError] = useState(null);

    // Edit state
    const [editingChannel, setEditingChannel] = useState(null);
    const [editName, setEditName] = useState('');
    const [editUrl, setEditUrl] = useState('');

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async (retries = 3, delay = 1000, showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const data = await getChannels();
            setChannels(data);
            setError(null);
            setLoading(false);
        } catch (err) {
            console.error(err);
            if (retries > 0) {
                console.log(`Retrying fetch... (${retries} attempts left)`);
                setTimeout(() => fetchChannels(retries - 1, delay * 2, showLoader), delay);
                return; // Don't stop loading yet
            }
            setError("Failed to load channels. Is the backend running?");
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newUrl) return;
        setError(null);

        let urlToAdd = newUrl;

        // If DM, construct the full URL from the ID
        if (activeType === 'DM') {
            // Remove any whitespace
            const cleanId = newUrl.trim();
            // Basic ID validation (digits only)
            if (!/^\d+$/.test(cleanId)) {
                setError("Invalid DM ID. Please enter digits only.");
                setTimeout(() => setError(null), 5000);
                return;
            }
            urlToAdd = `https://discord.com/channels/@me/${cleanId}`;
        }

        // Validate URL format
        const discordRegex = /^https:\/\/discord\.com\/channels\/(\d+|@me)\/\d+$/;
        if (!discordRegex.test(urlToAdd)) {
            setError("Invalid Discord Channel URL. Must be: https://discord.com/channels/GUILD_ID/CHANNEL_ID or https://discord.com/channels/@me/CHANNEL_ID");
            setTimeout(() => setError(null), 5000);
            return;
        }

        try {
            const updated = await addChannel(activeType, urlToAdd, newName);
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

    const handleEditClick = (channel) => {
        setEditingChannel(channel.url);
        setEditName(channel.name);
        // For DM, show ID? No, let's show full URL for consistency, or try to extract ID if DM.
        // Let's show full URL but if it's DM and user enters ID, we handle it.
        // Actually, for simplicity, let's just show the URL.
        // But user asked to edit ID for DM.
        // Let's check if it's a DM URL and extract ID for display?
        // "https://discord.com/channels/@me/123456"
        if (activeType === 'DM') {
            const match = channel.url.match(/@me\/(\d+)/);
            if (match) {
                setEditUrl(match[1]);
            } else {
                setEditUrl(channel.url);
            }
        } else {
            setEditUrl(channel.url);
        }
    };

    const handleUpdateSave = async () => {
        if (!editName.trim() || !editUrl.trim()) return;

        let urlToUpdate = editUrl.trim();

        // If DM and looks like ID, reconstruct URL
        if (activeType === 'DM' && /^\d+$/.test(urlToUpdate)) {
            urlToUpdate = `https://discord.com/channels/@me/${urlToUpdate}`;
        }

        try {
            const updated = await updateChannel(editingChannel, urlToUpdate, editName);
            setChannels(updated);
            setEditingChannel(null);
            setEditName('');
            setEditUrl('');
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data) {
                setError(err.response.data.error || "Failed to update channel");
            } else {
                setError("Failed to update channel");
            }
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleResetFailure = async (url) => {
        try {
            const updated = await resetFailure(url);
            setChannels(updated);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <ExportModal
                isOpen={showExport}
                onClose={() => setShowExport(false)}
                channels={channels}
            />
            <ImportModal
                isOpen={showImport}
                onClose={() => setShowImport(false)}
                currentChannels={channels}
                onImportSuccess={() => {
                    fetchChannels(3, 1000, false);
                    // Keep modal open to show results, user closes it manually
                }}
            />
            <TypeManagerModal
                isOpen={showTypeManager}
                onClose={() => setShowTypeManager(false)}
                channelTypes={channelTypes.filter(t => t !== 'DM')}
                onUpdate={fetchChannels}
            />

            {loading ? (
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
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
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setShowImport(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
                            >
                                <Upload className="w-4 h-4" />
                                Import
                            </button>
                            <button
                                onClick={() => setShowExport(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </motion.div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Types (Desktop) / Dropdown (Mobile) */}
                        <div className="w-full lg:w-72 space-y-2">
                            {/* Mobile Dropdown */}
                            <div className="lg:hidden flex gap-2">
                                <div className="relative flex-1">
                                    <select
                                        value={activeType}
                                        onChange={(e) => setActiveType(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                                    >
                                        {channelTypes.map(type => (
                                            <option key={type} value={type} className="bg-black text-white">
                                                {type} ({channels[type]?.length || 0})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        ▼
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowTypeManager(true)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <Cog className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Desktop Sidebar */}
                            <div className="hidden lg:block space-y-2">
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Channel Types</span>
                                    <button
                                        onClick={() => setShowTypeManager(true)}
                                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                        title="Manage Types"
                                    >
                                        <Cog className="w-4 h-4" />
                                    </button>
                                </div>
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
                                    <div className="flex-[2] flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Name (optional)"
                                            className="w-full sm:w-1/3 bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                                        />
                                        <input
                                            type="text"
                                            value={newUrl}
                                            onChange={(e) => setNewUrl(e.target.value)}
                                            placeholder={activeType === 'DM' ? "DM ID" : "URL..."}
                                            className="flex-1 bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                                        />
                                        <button
                                            onClick={handleAdd}
                                            className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-bold flex items-center justify-center transition-colors shadow-lg hover:shadow-white/20 cursor-pointer"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between gap-2 text-red-400 text-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                        <button
                                            onClick={() => fetchChannels()}
                                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-xs font-bold transition-colors"
                                        >
                                            Retry
                                        </button>
                                    </motion.div>
                                )}
                            </GlowCard>

                            {/* Helper for DM */}
                            {activeType === 'DM' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-sm text-blue-300"
                                >
                                    <p className="font-bold mb-1">How to get DM Channel ID:</p>
                                    <ol className="list-decimal list-inside space-y-1 opacity-80">
                                        <li>Enable <strong>Developer Mode</strong> in Discord Settings {'>'} Advanced</li>
                                        <li>Right-click the DM in your list</li>
                                        <li>Select <strong>Copy Channel ID</strong></li>
                                        <li>Paste the <strong>ID</strong> above (e.g. <code>123456789</code>)</li>
                                    </ol>
                                </motion.div>
                            )}

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
                                        const isEditing = editingChannel === channel.url;

                                        return (
                                            <motion.div
                                                key={channel.url}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ delay: index * 0.03 }}
                                                className={`group relative bg-white/5 hover:bg-white/10 border p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between transition-colors duration-200 backdrop-blur-sm w-full max-w-full overflow-hidden gap-3 ${hasFailures
                                                    ? 'border-red-500/50 shadow-[0_0_15px_-5px_rgba(239,68,68,0.5)]'
                                                    : 'border-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden w-full sm:w-auto flex-1">
                                                    <div className={`p-2 rounded-lg shrink-0 ${isEveryone ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-800 text-gray-500'}`}>
                                                        <Hash className="w-5 h-5" />
                                                    </div>

                                                    {isEditing ? (
                                                        <div className="flex flex-col gap-2 flex-1 max-w-md">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={editName}
                                                                    onChange={(e) => setEditName(e.target.value)}
                                                                    placeholder="Name"
                                                                    className="flex-1 bg-black/50 border border-white/20 rounded px-2 py-1 text-white text-sm outline-none focus:border-primary"
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={handleUpdateSave}
                                                                    className="p-1 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingChannel(null)}
                                                                    className="p-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={editUrl}
                                                                onChange={(e) => setEditUrl(e.target.value)}
                                                                placeholder={activeType === 'DM' ? "DM ID" : "Channel URL"}
                                                                className="w-full bg-black/50 border border-white/20 rounded px-2 py-1 text-gray-300 text-xs font-mono outline-none focus:border-primary"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleUpdateSave();
                                                                    if (e.key === 'Escape') setEditingChannel(null);
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-white font-bold truncate">
                                                                    {channel.name}
                                                                </div>
                                                                {hasFailures && (
                                                                    <div className="flex items-center bg-red-500/20 border border-red-500/30 rounded px-2 py-0.5">
                                                                        <span className="text-red-500 text-xs font-bold flex items-center gap-1">
                                                                            <AlertCircle className="w-3 h-3" />
                                                                            <span className="hidden sm:inline">{channel.failures} failures</span>
                                                                            <span className="sm:hidden">{channel.failures}</span>
                                                                        </span>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleResetFailure(channel.url);
                                                                            }}
                                                                            className="ml-2 p-0.5 hover:bg-red-500/20 rounded-full text-red-400 transition-colors cursor-pointer"
                                                                            title="Reset failures"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="truncate text-xs text-gray-500 font-mono group-hover:text-gray-300 transition-colors">
                                                                {channel.url}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all sm:translate-x-4 sm:group-hover:translate-x-0 duration-200">
                                                    <button
                                                        onClick={() => handleToggleEveryone(channel.url)}
                                                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isEveryone
                                                            ? 'bg-yellow-500 text-black shadow-[0_0_15px_-3px_rgba(234,179,8,0.5)]'
                                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                            } cursor-pointer text-center`}
                                                    >
                                                        {isEveryone ? '@everyone' : 'Standard'}
                                                    </button>

                                                    <button
                                                        onClick={() => handleEditClick(channel)}
                                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <Pencil className="w-4 h-4" />
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
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Channels;
