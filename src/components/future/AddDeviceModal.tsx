'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ChevronRight,
    Check,
    Wifi,
    Shield,
    Upload,
    FileText,
    Watch,
    Heart,
    Activity,
    Smartphone,
    Scale,
    Moon,
    Cpu,
    type LucideIcon,
} from 'lucide-react';

// ===== Device Catalog =====

interface Device {
    id: string;
    name: string;
    brand: string;
    model: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    category: string;
    metrics: string[];
    exportSteps: string[];
    folderPath: string;
    isNew?: boolean;
}

const DEVICES: Device[] = [
    {
        id: 'whoop5',
        name: 'WHOOP',
        brand: 'WHOOP',
        model: '5.0 / MG',
        icon: Activity,
        color: '#00f5d4',
        bg: 'linear-gradient(135deg, #00f5d4, #00b4d8)',
        category: 'Wearable',
        metrics: ['HRV', 'Recovery', 'Strain', 'Sleep', 'SpO₂', 'Skin Conductance', 'Blood Pressure'],
        exportSteps: [
            'Open WHOOP app → Profile → Privacy & Security',
            'Tap "Request Data Export"',
            'Download ZIP and extract',
            'Place CSV files in data/Activity/Whoop/',
        ],
        folderPath: 'data/Activity/Whoop/',
        isNew: true,
    },
    {
        id: 'apple_watch',
        name: 'Apple Watch',
        brand: 'Apple',
        model: 'Series 10 / Ultra 2',
        icon: Watch,
        color: '#f5a623',
        bg: 'linear-gradient(135deg, #f5a623, #e8590c)',
        category: 'Wearable',
        metrics: ['HRV', 'RHR', 'Sleep', 'ECG', 'SpO₂', 'Crash Detection', 'Temperature'],
        exportSteps: [
            'Open Health app → your profile photo',
            'Tap "Export All Health Data"',
            'Share the ZIP file',
            'Place in data/Activity/Apple Health/',
        ],
        folderPath: 'data/Activity/Apple Health/',
    },
    {
        id: 'oura4',
        name: 'Oura Ring',
        brand: 'Oura',
        model: 'Gen 4',
        icon: Heart,
        color: '#a78bfa',
        bg: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
        category: 'Wearable',
        metrics: ['Readiness', 'HRV', 'Sleep Stages', 'Temp', 'SpO₂', 'Resilience', 'Cardiovascular Age'],
        exportSteps: [
            'Open Oura app → Profile → Account',
            'Tap "Export Data" → Download JSON',
            'Place in data/Activity/Oura/',
        ],
        folderPath: 'data/Activity/Oura/',
    },
    {
        id: 'withings_scan',
        name: 'Withings',
        brand: 'Withings',
        model: 'ScanWatch 2 / Body Scan',
        icon: Heart,
        color: '#34d399',
        bg: 'linear-gradient(135deg, #34d399, #059669)',
        category: 'Wearable + Scale',
        metrics: ['Sleep Apnea', 'SpO₂', 'HRV', 'ECG', 'PWV', 'Segmental Body Comp', 'Nerve Health'],
        exportSteps: [
            'Open Health Mate app → Profile',
            'Tap "Export My Data" → CSV',
            'Place in data/Activity/Withings/',
        ],
        folderPath: 'data/Activity/Withings/',
        isNew: true,
    },
    {
        id: 'samsung7',
        name: 'Galaxy Watch',
        brand: 'Samsung',
        model: '7 / Ultra',
        icon: Watch,
        color: '#60a5fa',
        bg: 'linear-gradient(135deg, #60a5fa, #2563eb)',
        category: 'Wearable',
        metrics: ['BioActive Sensor', 'Sleep', 'Stress', 'Body Comp', 'Irregular Rhythm', 'SpO₂'],
        exportSteps: [
            'Open Samsung Health → Profile → Download Personal Data',
            'Select data types and download',
            'Place in data/Activity/Samsung Health/',
        ],
        folderPath: 'data/Activity/Samsung Health/',
        isNew: true,
    },
    {
        id: 'google_fit',
        name: 'Google Fit',
        brand: 'Google',
        model: 'Pixel Watch 3',
        icon: Smartphone,
        color: '#fb923c',
        bg: 'linear-gradient(135deg, #fb923c, #ea580c)',
        category: 'Wearable',
        metrics: ['Heart Rate', 'Steps', 'Sleep', 'SpO₂', 'Cardio Load', 'Readiness'],
        exportSteps: [
            'Go to takeout.google.com',
            'Select "Fit" data → Export',
            'Place CSV files in data/Activity/Google Fit/',
        ],
        folderPath: 'data/Activity/Google Fit/',
        isNew: true,
    },
    {
        id: 'fitbit',
        name: 'Fitbit',
        brand: 'Fitbit / Google',
        model: 'Charge 6 / Sense 3',
        icon: Activity,
        color: '#4ade80',
        bg: 'linear-gradient(135deg, #4ade80, #16a34a)',
        category: 'Wearable',
        metrics: ['HRV', 'Sleep', 'Steps', 'SpO₂', 'Stress Score', 'ECG', 'Daily Readiness'],
        exportSteps: [
            'Go to takeout.google.com',
            'Select "Fitbit" data → Export',
            'Place JSON files in data/Activity/Fitbit/',
        ],
        folderPath: 'data/Activity/Fitbit/',
    },
    {
        id: 'withings_scale',
        name: 'Body Scan Scale',
        brand: 'Withings',
        model: 'Body Scan / Body+',
        icon: Scale,
        color: '#34d399',
        bg: 'linear-gradient(135deg, #34d399, #059669)',
        category: 'Smart Scale',
        metrics: ['Weight', 'Body Fat', 'Muscle Mass', 'Bone Mass', 'Visceral Fat', 'Nerve Health', 'Segmental Analysis'],
        exportSteps: [
            'Open Health Mate → Profile → Export My Data',
            'Download CSV files',
            'Place in data/Activity/Withings/',
        ],
        folderPath: 'data/Activity/Withings/',
    },
    {
        id: 'garmin',
        name: 'Garmin',
        brand: 'Garmin',
        model: 'Fenix 8 / Forerunner 965',
        icon: Cpu,
        color: '#38bdf8',
        bg: 'linear-gradient(135deg, #38bdf8, #0284c7)',
        category: 'Wearable',
        metrics: ['HRV Status', 'Body Battery', 'Training Readiness', 'VO₂ Max', 'Pulse Ox'],
        exportSteps: [
            'Go to connect.garmin.com → Account → Export Data',
            'Download FIT/CSV files',
            'Place in data/Activity/',
        ],
        folderPath: 'data/Activity/',
    },
    {
        id: 'eight_sleep',
        name: 'Eight Sleep',
        brand: 'Eight Sleep',
        model: 'Pod 4 Ultra',
        icon: Moon,
        color: '#818cf8',
        bg: 'linear-gradient(135deg, #818cf8, #4f46e5)',
        category: 'Sleep Tracker',
        metrics: ['Sleep Stages', 'HRV', 'Heart Rate', 'Respiratory Rate', 'Temperature'],
        exportSteps: [
            'API integration coming soon',
            'Contact support@eightsleep.com for data export',
        ],
        folderPath: 'data/Activity/',
    },
];

// ===== Step views =====

type Step = 'list' | 'detail' | 'connecting' | 'success';

interface AddDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect?: (deviceId: string, deviceName: string) => void;
}

export default function AddDeviceModal({ isOpen, onClose, onConnect }: AddDeviceModalProps) {
    const [step, setStep] = useState<Step>('list');
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep('list');
                setSelectedDevice(null);
                setSearchQuery('');
                setActiveCategory('All');
            }, 300);
        }
    }, [isOpen]);

    const categories = ['All', 'Wearable', 'Smart Scale', 'Sleep Tracker', 'Wearable + Scale'];

    const filteredDevices = DEVICES.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.brand.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || d.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const handleSelectDevice = (device: Device) => {
        setSelectedDevice(device);
        setStep('detail');
    };

    const handleConnect = () => {
        if (!selectedDevice) return;
        setStep('connecting');
        setTimeout(() => {
            setStep('success');
            onConnect?.(selectedDevice.id, selectedDevice.name);
        }, 2000);
    };

    const handleDone = () => {
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
                    />

                    {/* Modal — Apple Health-inspired sheet */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg"
                    >
                        <div className="bg-[#111118]/98 border border-white/10 rounded-t-3xl shadow-2xl overflow-hidden backdrop-blur-2xl">
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full bg-white/20" />
                            </div>

                            {/* Content */}
                            <div className="px-6 pb-8 pt-2" style={{ minHeight: 480, maxHeight: '85vh', overflowY: 'auto' }}>
                                <AnimatePresence mode="wait">
                                    {/* ===== STEP: LIST ===== */}
                                    {step === 'list' && (
                                        <motion.div
                                            key="list"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                        >
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-5">
                                                <div>
                                                    <h2 className="text-xl font-bold text-white tracking-tight">Add Device</h2>
                                                    <p className="text-xs text-white/40 mt-0.5">Connect your health hardware</p>
                                                </div>
                                                <button
                                                    onClick={onClose}
                                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-white/60" />
                                                </button>
                                            </div>

                                            {/* Search */}
                                            <div className="relative mb-4">
                                                <input
                                                    type="text"
                                                    placeholder="Search devices..."
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    className="w-full bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/25 transition-colors"
                                                />
                                            </div>

                                            {/* Category pills */}
                                            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setActiveCategory(cat)}
                                                        className={`
                              flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all
                              ${activeCategory === cat
                                                                ? 'bg-white text-black'
                                                                : 'bg-white/8 text-white/50 hover:bg-white/12 hover:text-white'
                                                            }
                            `}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Device list */}
                                            <div className="space-y-2">
                                                {filteredDevices.map((device, i) => {
                                                    const Icon = device.icon;
                                                    return (
                                                        <motion.button
                                                            key={device.id}
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: i * 0.03 }}
                                                            onClick={() => handleSelectDevice(device)}
                                                            className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 transition-all group"
                                                        >
                                                            {/* Icon */}
                                                            <div
                                                                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                                                style={{ background: device.bg }}
                                                            >
                                                                <Icon className="w-5 h-5 text-white" />
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 text-left min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-semibold text-white">{device.name}</span>
                                                                    {device.isNew && (
                                                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/25">New</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-white/40 truncate">{device.brand} · {device.model}</p>
                                                            </div>

                                                            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0" />
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>

                                            {/* Privacy note */}
                                            <div className="mt-5 flex items-center gap-2 text-xs text-white/30">
                                                <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span>All data processed locally. Never uploaded to servers.</span>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ===== STEP: DETAIL ===== */}
                                    {step === 'detail' && selectedDevice && (
                                        <motion.div
                                            key="detail"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            {/* Header */}
                                            <div className="flex items-center gap-3 mb-5">
                                                <button
                                                    onClick={() => setStep('list')}
                                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
                                                >
                                                    <ChevronRight className="w-4 h-4 text-white/60 rotate-180" />
                                                </button>
                                                <h2 className="text-lg font-bold text-white">{selectedDevice.name} {selectedDevice.model}</h2>
                                                <button
                                                    onClick={onClose}
                                                    className="ml-auto w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-white/60" />
                                                </button>
                                            </div>

                                            {/* Device hero */}
                                            <div
                                                className="w-full h-28 rounded-2xl flex items-center justify-center mb-5"
                                                style={{ background: selectedDevice.bg, opacity: 0.9 }}
                                            >
                                                {(() => {
                                                    const Icon = selectedDevice.icon;
                                                    return <Icon className="w-12 h-12 text-white/90" />;
                                                })()}
                                            </div>

                                            {/* Metrics */}
                                            <div className="mb-5">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2">Tracked Metrics</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedDevice.metrics.map(m => (
                                                        <span
                                                            key={m}
                                                            className="text-xs px-2.5 py-1 rounded-full font-medium"
                                                            style={{
                                                                background: `${selectedDevice.color}18`,
                                                                color: selectedDevice.color,
                                                                border: `1px solid ${selectedDevice.color}28`,
                                                            }}
                                                        >
                                                            {m}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Export steps */}
                                            <div className="mb-6">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Upload className="w-3.5 h-3.5 text-white/40" />
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-white/30">How to Import</p>
                                                </div>
                                                <div className="space-y-2.5">
                                                    {selectedDevice.exportSteps.map((step, i) => (
                                                        <div key={i} className="flex gap-3">
                                                            <span
                                                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                                                                style={{ background: `${selectedDevice.color}20`, color: selectedDevice.color }}
                                                            >
                                                                {i + 1}
                                                            </span>
                                                            <p className="text-sm text-white/60 leading-relaxed">{step}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-3 px-3 py-2 rounded-xl bg-black/30 border border-white/8">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                                                        <code className="text-xs text-white/40 font-mono">{selectedDevice.folderPath}</code>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Connect button */}
                                            <motion.button
                                                onClick={handleConnect}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all"
                                                style={{ background: selectedDevice.bg }}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    <Wifi className="w-4 h-4" />
                                                    Connect {selectedDevice.name}
                                                </div>
                                            </motion.button>
                                        </motion.div>
                                    )}

                                    {/* ===== STEP: CONNECTING ===== */}
                                    {step === 'connecting' && selectedDevice && (
                                        <motion.div
                                            key="connecting"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="flex flex-col items-center justify-center py-16 text-center"
                                        >
                                            <div
                                                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 relative"
                                                style={{ background: selectedDevice.bg }}
                                            >
                                                {(() => {
                                                    const Icon = selectedDevice.icon;
                                                    return <Icon className="w-10 h-10 text-white" />;
                                                })()}
                                                {/* Pulse rings */}
                                                {[1, 2, 3].map(i => (
                                                    <motion.div
                                                        key={i}
                                                        className="absolute inset-0 rounded-3xl border-2"
                                                        style={{ borderColor: selectedDevice.color }}
                                                        animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.6, 0] }}
                                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                                                    />
                                                ))}
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2">Connecting...</h3>
                                            <p className="text-sm text-white/40">Setting up {selectedDevice.name} {selectedDevice.model}</p>
                                        </motion.div>
                                    )}

                                    {/* ===== STEP: SUCCESS ===== */}
                                    {step === 'success' && selectedDevice && (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="flex flex-col items-center justify-center py-12 text-center"
                                        >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                                                className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6"
                                            >
                                                <Check className="w-10 h-10 text-emerald-400" />
                                            </motion.div>
                                            <h3 className="text-xl font-bold text-white mb-2">Connected!</h3>
                                            <p className="text-sm text-white/50 mb-2">
                                                {selectedDevice.name} {selectedDevice.model} is ready.
                                            </p>
                                            <p className="text-xs text-white/30 mb-8">
                                                Place your export files in <code className="text-white/40">{selectedDevice.folderPath}</code> and sync.
                                            </p>
                                            <motion.button
                                                onClick={handleDone}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="px-8 py-3 rounded-2xl bg-white text-black text-sm font-semibold"
                                            >
                                                Done
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
