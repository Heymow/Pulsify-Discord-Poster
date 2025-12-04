import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Download, X, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowCard from './GlowCard';

const ExportModal = ({ isOpen, onClose, channels }) => {
    const [selectedCategories, setSelectedCategories] = useState(
        Object.keys(channels).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    const toggleCategory = (category) => {
        setSelectedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const toggleAll = () => {
        const allSelected = Object.values(selectedCategories).every(Boolean);
        const newState = Object.keys(selectedCategories).reduce((acc, key) => ({
            ...acc,
            [key]: !allSelected
        }), {});
        setSelectedCategories(newState);
    };

    const handleExport = () => {
        const exportData = {};
        Object.keys(channels).forEach(key => {
            if (selectedCategories[key]) {
                exportData[key] = channels[key];
            }
        });

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "discord_channels.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        onClose();
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-md relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GlowCard className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Download className="w-6 h-6 text-primary" />
                                Export Channels
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-4 flex justify-end">
                            <button
                                onClick={toggleAll}
                                className="text-xs text-gray-400 hover:text-white transition-colors"
                            >
                                {Object.values(selectedCategories).every(Boolean) ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 mb-6">
                            {Object.keys(channels).map(category => (
                                <div
                                    key={category}
                                    onClick={() => toggleCategory(category)}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedCategories[category] ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {selectedCategories[category] ? (
                                            <CheckSquare className="w-5 h-5 text-primary" />
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-500" />
                                        )}
                                        <span className={selectedCategories[category] ? 'text-white' : 'text-gray-400'}>
                                            {category}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded text-gray-400">
                                        {channels[category]?.length || 0}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleExport}
                            className="w-full py-3 rounded-xl font-bold text-lg uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Download className="w-5 h-5" />
                            Export Selection
                        </button>
                    </GlowCard>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default ExportModal;
