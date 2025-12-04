import React, { useState, useRef } from 'react';
import { Upload, X, CheckSquare, Square, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowCard from './GlowCard';
import { importChannels } from '../api';

const ImportModal = ({ isOpen, onClose, onImportSuccess }) => {
    const [parsedData, setParsedData] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState({});
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            parseFile(selectedFile);
        }
    };

    const parseFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                setParsedData(json);
                // Select all by default
                const initialSelection = Object.keys(json).reduce((acc, key) => ({ ...acc, [key]: true }), {});
                setSelectedCategories(initialSelection);
                setError(null);
                setResult(null);
            } catch {
                setError("Invalid JSON file");
                setParsedData(null);
            }
        };
        reader.readAsText(file);
    };

    const toggleCategory = (category) => {
        setSelectedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const handleImport = async () => {
        if (!parsedData) return;
        setLoading(true);
        setError(null);

        const dataToImport = {};
        const discordRegex = /^https:\/\/discord\.com\/channels\/\d+\/\d+$/;
        let invalidCount = 0;

        Object.keys(parsedData).forEach(key => {
            if (selectedCategories[key] && Array.isArray(parsedData[key])) {
                // Filter valid URLs
                const validChannels = parsedData[key].filter(channel => {
                    const url = typeof channel === 'string' ? channel : channel.url;
                    if (!url || !discordRegex.test(url)) {
                        invalidCount++;
                        return false;
                    }
                    return true;
                });

                if (validChannels.length > 0) {
                    dataToImport[key] = validChannels;
                }
            }
        });

        if (invalidCount > 0) {
            console.warn(`Skipped ${invalidCount} invalid URLs during import.`);
        }

        try {
            const stats = await importChannels(dataToImport);
            setResult(stats);
            if (onImportSuccess) onImportSuccess();
        } catch {
            setError("Import failed");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setParsedData(null);
        setResult(null);
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-md"
                >
                    <GlowCard className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Upload className="w-6 h-6 text-secondary" />
                                Import Channels
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {!parsedData && !result && (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-secondary/50 hover:bg-white/5 transition-all group"
                            >
                                <FileJson className="w-12 h-12 text-gray-500 group-hover:text-secondary mb-4 transition-colors" />
                                <p className="text-gray-400 group-hover:text-white font-medium">Click to upload JSON</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".json"
                                    className="hidden"
                                />
                                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                            </div>
                        )}

                        {parsedData && !result && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-gray-400">Select categories to import:</span>
                                    <button onClick={reset} className="text-xs text-red-400 hover:text-red-300">Change File</button>
                                </div>

                                <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 mb-6">
                                    {Object.keys(parsedData).map(category => (
                                        <div
                                            key={category}
                                            onClick={() => toggleCategory(category)}
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedCategories[category] ? 'bg-secondary/20 border border-secondary/30' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {selectedCategories[category] ? (
                                                    <CheckSquare className="w-5 h-5 text-secondary" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-gray-500" />
                                                )}
                                                <span className={selectedCategories[category] ? 'text-white' : 'text-gray-400'}>
                                                    {category}
                                                </span>
                                            </div>
                                            <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded text-gray-400">
                                                {Array.isArray(parsedData[category]) ? parsedData[category].length : 0}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleImport}
                                    disabled={loading}
                                    className={`w-full py-3 rounded-xl font-bold text-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${loading
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-secondary hover:bg-secondary/90 text-white shadow-secondary/30 hover:shadow-secondary/50 hover:-translate-y-1 cursor-pointer'
                                        }`}
                                >
                                    {loading ? 'Importing...' : 'Start Import'}
                                </button>
                            </>
                        )}

                        {result && (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Import Complete!</h3>
                                <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <div className="text-2xl font-bold text-green-400">{result.added}</div>
                                        <div className="text-xs text-gray-500 uppercase">Added</div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-400">{result.updated}</div>
                                        <div className="text-xs text-gray-500 uppercase">Updated</div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-400">{result.skipped}</div>
                                        <div className="text-xs text-gray-500 uppercase">Skipped</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { reset(); onClose(); }}
                                    className="mt-6 text-gray-400 hover:text-white text-sm underline"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </GlowCard>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ImportModal;
