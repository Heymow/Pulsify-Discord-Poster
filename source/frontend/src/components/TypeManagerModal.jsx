import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Pencil, Check, AlertCircle } from 'lucide-react';
import ReactDOM from 'react-dom';
import { addType, removeType, renameType } from '../api';

const TypeManagerModal = ({ isOpen, onClose, channelTypes, onUpdate }) => {
    const [newType, setNewType] = useState('');
    const [editingType, setEditingType] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleAdd = async () => {
        if (!newType.trim()) return;
        setLoading(true);
        setError(null);
        try {
            await addType(newType.trim());
            setNewType('');
            onUpdate();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to add type");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (type) => {
        if (!confirm(`Are you sure you want to delete type "${type}"? All channels in this type will be lost.`)) return;
        setLoading(true);
        setError(null);
        try {
            await removeType(type);
            onUpdate();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to remove type");
        } finally {
            setLoading(false);
        }
    };

    const handleRename = async () => {
        if (!editValue.trim() || editValue === editingType) {
            setEditingType(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await renameType(editingType, editValue.trim());
            setEditingType(null);
            onUpdate();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to rename type");
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (type) => {
        setEditingType(type);
        setEditValue(type);
    };

    return ReactDOM.createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Manage Channel Types</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {/* Add New */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newType}
                                onChange={(e) => setNewType(e.target.value)}
                                placeholder="New type name..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-primary transition-colors"
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                            <button
                                onClick={handleAdd}
                                disabled={loading || !newType.trim()}
                                className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </button>
                        </div>

                        {/* List */}
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {channelTypes.map((type) => (
                                <div key={type} className="flex items-center justify-between p-3 bg-white/5 rounded-lg group hover:bg-white/10 transition-colors border border-transparent hover:border-white/5">
                                    {editingType === type ? (
                                        <div className="flex items-center gap-2 flex-1 mr-2">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="flex-1 bg-black/50 border border-white/20 rounded px-2 py-1 text-white text-sm outline-none focus:border-primary"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRename();
                                                    if (e.key === 'Escape') setEditingType(null);
                                                }}
                                            />
                                            <button onClick={handleRename} className="p-1 text-green-500 hover:bg-green-500/20 rounded cursor-pointer">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setEditingType(null)} className="p-1 text-red-500 hover:bg-red-500/20 rounded cursor-pointer">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-medium text-gray-200">{type}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(type)}
                                                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Rename"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemove(type)}
                                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {channelTypes.length === 0 && (
                                <div className="text-center text-gray-500 py-4">No types found</div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default TypeManagerModal;
