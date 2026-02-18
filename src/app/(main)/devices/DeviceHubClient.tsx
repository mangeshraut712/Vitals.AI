'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AddDeviceModal from '@/components/future/AddDeviceModal';
import {
    Watch,
    Heart,
    Activity,
    Wifi,
    WifiOff,
    CheckCircle2,
    AlertCircle,
    Upload,
    ExternalLink,
    ChevronRight,
    Zap,
    Shield,
    Smartphone,
    Scale,
    Moon,
    Cpu,
    type LucideIcon,
} from 'lucide-react';

// ===== Device Definitions =====

interface DeviceInfo {
    id: string;
    name: string;
    brand: string;
    category: 'wearable' | 'scale' | 'sleep' | 'fitness';
    icon: LucideIcon;
    color: string;
    gradientFrom: string;
    gradientTo: string;
    metrics: string[];
    exportFormat: string;
    exportGuide: string;
    folderName: string;
    status: 'supported' | 'beta' | 'coming_soon';
    year: number;
    features: string[];
}

const DEVICES: DeviceInfo[] = [
    {
        id: 'whoop',
        name: 'WHOOP 4.0 / 5.0',
        brand: 'WHOOP',
        category: 'wearable',
        icon: Activity,
        color: '#00f5d4',
        gradientFrom: '#00f5d4',
        gradientTo: '#00b4d8',
        metrics: ['HRV', 'Recovery', 'Strain', 'Sleep', 'Respiratory Rate', 'Blood Oxygen'],
        exportFormat: 'CSV (Physiological Cycles, Sleeps, Workouts)',
        exportGuide: 'https://support.whoop.com/s/article/Exporting-Your-Data',
        folderName: 'data/Activity/Whoop/',
        status: 'supported',
        year: 2026,
        features: ['Skin conductance', 'Blood oxygen', 'Respiratory rate', 'Strain scoring'],
    },
    {
        id: 'apple_watch',
        name: 'Apple Watch Series 10 / Ultra 2',
        brand: 'Apple',
        category: 'wearable',
        icon: Watch,
        color: '#f5a623',
        gradientFrom: '#f5a623',
        gradientTo: '#e8590c',
        metrics: ['HRV', 'RHR', 'Sleep', 'Steps', 'ECG', 'Blood Oxygen', 'Crash Detection'],
        exportFormat: 'XML (Apple Health Export)',
        exportGuide: 'https://support.apple.com/guide/iphone/share-your-health-data-iph5ede58c3d/ios',
        folderName: 'data/Activity/Apple Health/',
        status: 'supported',
        year: 2026,
        features: ['ECG', 'AFib detection', 'Blood oxygen', 'Crash detection', 'Temperature'],
    },
    {
        id: 'oura',
        name: 'Oura Ring Gen 4',
        brand: 'Oura',
        category: 'wearable',
        icon: Heart,
        color: '#a78bfa',
        gradientFrom: '#a78bfa',
        gradientTo: '#7c3aed',
        metrics: ['Readiness', 'HRV', 'Sleep Stages', 'Temperature', 'SpO2', 'Resilience'],
        exportFormat: 'JSON (Oura API v2)',
        exportGuide: 'https://cloud.ouraring.com/docs/data-types',
        folderName: 'data/Activity/Oura/',
        status: 'supported',
        year: 2026,
        features: ['Resilience score', 'Cardiovascular age', 'Daytime stress', 'Cycle tracking'],
    },
    {
        id: 'withings',
        name: 'Withings ScanWatch 2 / Nova',
        brand: 'Withings',
        category: 'wearable',
        icon: Heart,
        color: '#34d399',
        gradientFrom: '#34d399',
        gradientTo: '#059669',
        metrics: ['Sleep Apnea', 'SpO2', 'HRV', 'ECG', 'Arterial Stiffness', 'Body Composition'],
        exportFormat: 'CSV (Health Mate Export)',
        exportGuide: 'https://support.withings.com/hc/en-us/articles/201491377',
        folderName: 'data/Activity/Withings/',
        status: 'supported',
        year: 2026,
        features: ['Sleep apnea detection', 'Pulse wave velocity', 'ECG', 'Breathing disturbances'],
    },
    {
        id: 'samsung',
        name: 'Galaxy Watch 7 / Ultra',
        brand: 'Samsung',
        category: 'wearable',
        icon: Watch,
        color: '#60a5fa',
        gradientFrom: '#60a5fa',
        gradientTo: '#2563eb',
        metrics: ['BioActive Sensor', 'Sleep', 'Stress', 'Body Composition', 'Irregular Rhythm'],
        exportFormat: 'CSV (Samsung Health Export)',
        exportGuide: 'https://support.google.com/android/answer/9431959',
        folderName: 'data/Activity/Samsung Health/',
        status: 'supported',
        year: 2026,
        features: ['BioActive sensor', 'Body composition', 'Stress tracking', 'Irregular rhythm'],
    },
    {
        id: 'google_fit',
        name: 'Pixel Watch 3 / Google Fit',
        brand: 'Google',
        category: 'wearable',
        icon: Smartphone,
        color: '#fb923c',
        gradientFrom: '#fb923c',
        gradientTo: '#ea580c',
        metrics: ['Heart Rate', 'Steps', 'Sleep', 'SpO2', 'Cardio Load', 'Readiness'],
        exportFormat: 'CSV (Google Takeout)',
        exportGuide: 'https://takeout.google.com/',
        folderName: 'data/Activity/Google Fit/',
        status: 'supported',
        year: 2026,
        features: ['Cardio load', 'Readiness score', 'Loss of pulse detection', 'SpO2 tracking'],
    },
    {
        id: 'fitbit',
        name: 'Fitbit Charge 6 / Sense 3',
        brand: 'Fitbit / Google',
        category: 'wearable',
        icon: Activity,
        color: '#4ade80',
        gradientFrom: '#4ade80',
        gradientTo: '#16a34a',
        metrics: ['HRV', 'Sleep', 'Steps', 'SpO2', 'Stress Score', 'ECG'],
        exportFormat: 'JSON (Google Takeout)',
        exportGuide: 'https://help.fitbit.com/manuals/manual_tracker_data_export.htm',
        folderName: 'data/Activity/Fitbit/',
        status: 'supported',
        year: 2026,
        features: ['Daily Readiness Score', 'Stress management', 'ECG', 'Irregular heart rhythm'],
    },
    {
        id: 'withings_scale',
        name: 'Withings Body Scan / Body+',
        brand: 'Withings',
        category: 'scale',
        icon: Scale,
        color: '#34d399',
        gradientFrom: '#34d399',
        gradientTo: '#059669',
        metrics: ['Weight', 'Body Fat', 'Muscle Mass', 'Bone Mass', 'Visceral Fat', 'Nerve Health'],
        exportFormat: 'CSV (Health Mate Export)',
        exportGuide: 'https://support.withings.com/hc/en-us/articles/201491377',
        folderName: 'data/Activity/Withings/',
        status: 'supported',
        year: 2026,
        features: ['Nerve health assessment', 'Vascular age', 'Electrodermal activity', 'Segmental body composition'],
    },
    {
        id: 'eight_sleep',
        name: 'Eight Sleep Pod 4 Ultra',
        brand: 'Eight Sleep',
        category: 'sleep',
        icon: Moon,
        color: '#818cf8',
        gradientFrom: '#818cf8',
        gradientTo: '#4f46e5',
        metrics: ['Sleep Stages', 'HRV', 'Heart Rate', 'Respiratory Rate', 'Temperature'],
        exportFormat: 'API Integration (Coming Soon)',
        exportGuide: '#',
        folderName: 'data/Activity/',
        status: 'coming_soon',
        year: 2026,
        features: ['Autopilot temperature', 'Sleep coaching', 'Snoring detection', 'Vibration alarm'],
    },
    {
        id: 'garmin',
        name: 'Garmin Fenix 8 / Forerunner 965',
        brand: 'Garmin',
        category: 'wearable',
        icon: Cpu,
        color: '#38bdf8',
        gradientFrom: '#38bdf8',
        gradientTo: '#0284c7',
        metrics: ['HRV Status', 'Body Battery', 'Training Readiness', 'VO2 Max', 'Pulse Ox'],
        exportFormat: 'FIT/CSV (Garmin Connect)',
        exportGuide: 'https://support.garmin.com/en-US/?faq=W1TvTPW8JZ6LfJSfK512Q8',
        folderName: 'data/Activity/',
        status: 'beta',
        year: 2026,
        features: ['HRV status', 'Body Battery', 'Training readiness', 'Race predictor'],
    },
];

// ===== Sub-components =====

function StatusBadge({ status }: { status: DeviceInfo['status'] }) {
    const config = {
        supported: { label: 'Supported', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
        beta: { label: 'Beta', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
        coming_soon: { label: 'Coming Soon', className: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
    };
    const { label, className } = config[status];
    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${className}`}>
            {label}
        </span>
    );
}

function DeviceCard({ device, isSelected, onClick }: {
    device: DeviceInfo;
    isSelected: boolean;
    onClick: () => void;
}) {
    const Icon = device.icon;

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`
        w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer
        ${isSelected
                    ? 'border-white/20 bg-white/8 shadow-lg'
                    : 'border-white/8 bg-white/4 hover:border-white/15 hover:bg-white/6'
                }
      `}
        >
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                        background: `linear-gradient(135deg, ${device.gradientFrom}20, ${device.gradientTo}30)`,
                        border: `1px solid ${device.gradientFrom}30`,
                    }}
                >
                    <Icon className="w-5 h-5" style={{ color: device.gradientFrom }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">{device.name}</span>
                        <StatusBadge status={device.status} />
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">{device.brand}</p>
                </div>
                <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isSelected ? 'rotate-90 text-white/60' : 'text-white/30'}`}
                />
            </div>
        </motion.button>
    );
}

function DeviceDetailPanel({ device }: { device: DeviceInfo }) {
    const Icon = device.icon;

    return (
        <motion.div
            key={device.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
        >
            {/* Device Header */}
            <div className="flex items-center gap-4">
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                        background: `linear-gradient(135deg, ${device.gradientFrom}25, ${device.gradientTo}35)`,
                        border: `1px solid ${device.gradientFrom}40`,
                        boxShadow: `0 0 30px ${device.gradientFrom}15`,
                    }}
                >
                    <Icon className="w-8 h-8" style={{ color: device.gradientFrom }} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">{device.name}</h2>
                    <p className="text-white/50 text-sm">{device.brand} · {device.year}</p>
                    <div className="mt-1">
                        <StatusBadge status={device.status} />
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                    Tracked Metrics
                </h3>
                <div className="flex flex-wrap gap-2">
                    {device.metrics.map((metric) => (
                        <span
                            key={metric}
                            className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{
                                background: `${device.gradientFrom}15`,
                                color: device.gradientFrom,
                                border: `1px solid ${device.gradientFrom}25`,
                            }}
                        >
                            {metric}
                        </span>
                    ))}
                </div>
            </div>

            {/* Key Features */}
            <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                    Key Features
                </h3>
                <div className="space-y-2">
                    {device.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: device.gradientFrom }} />
                            <span className="text-sm text-white/70">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Setup Instructions */}
            {device.status !== 'coming_soon' && (
                <div className="rounded-2xl border border-white/10 bg-white/4 p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Upload className="w-4 h-4" style={{ color: device.gradientFrom }} />
                        How to Import Your Data
                    </h3>

                    <ol className="space-y-3">
                        <li className="flex gap-3">
                            <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                                style={{ background: `${device.gradientFrom}25`, color: device.gradientFrom }}
                            >
                                1
                            </span>
                            <div>
                                <p className="text-sm text-white/80">Export your data from the {device.brand} app</p>
                                <a
                                    href={device.exportGuide}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs flex items-center gap-1 mt-1 hover:underline"
                                    style={{ color: device.gradientFrom }}
                                >
                                    View export guide <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                                style={{ background: `${device.gradientFrom}25`, color: device.gradientFrom }}
                            >
                                2
                            </span>
                            <div>
                                <p className="text-sm text-white/80">Place exported files in:</p>
                                <code className="text-xs mt-1 block px-2 py-1 rounded-lg bg-black/30 text-white/60 font-mono">
                                    {device.folderName}
                                </code>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                                style={{ background: `${device.gradientFrom}25`, color: device.gradientFrom }}
                            >
                                3
                            </span>
                            <p className="text-sm text-white/80">Click <strong className="text-white">Sync Data</strong> in the top navigation to process your files</p>
                        </li>
                    </ol>

                    <div className="flex items-start gap-2 p-3 rounded-xl bg-black/20 border border-white/8">
                        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                        <p className="text-xs text-white/50">
                            Your data is processed entirely on your machine. Files are never uploaded to external servers.
                        </p>
                    </div>
                </div>
            )}

            {/* Coming Soon */}
            {device.status === 'coming_soon' && (
                <div className="rounded-2xl border border-white/10 bg-white/4 p-6 text-center">
                    <Zap className="w-8 h-8 mx-auto mb-3 text-white/30" />
                    <p className="text-sm font-semibold text-white/60">Integration Coming Soon</p>
                    <p className="text-xs text-white/40 mt-1">
                        We&apos;re working on native support for {device.brand}. Stay tuned for updates.
                    </p>
                </div>
            )}

            {/* Export Format */}
            <div className="flex items-center gap-2 text-xs text-white/40">
                <Wifi className="w-3.5 h-3.5" />
                <span>Export format: {device.exportFormat}</span>
            </div>
        </motion.div>
    );
}

// ===== Main Component =====

export default function DeviceHubClient() {
    const [selectedDevice, setSelectedDevice] = useState<DeviceInfo>(DEVICES[0]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);

    const categories = [
        { id: 'all', label: 'All Devices' },
        { id: 'wearable', label: 'Wearables' },
        { id: 'scale', label: 'Smart Scales' },
        { id: 'sleep', label: 'Sleep Trackers' },
    ];

    const filteredDevices = activeCategory === 'all'
        ? DEVICES
        : DEVICES.filter((d) => d.category === activeCategory);

    const supportedCount = DEVICES.filter((d) => d.status === 'supported').length;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Background gradient */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                            <Wifi className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-white">Device Hub</h1>
                            <p className="text-white/50 text-sm">2026 Health Hardware Integrations</p>
                        </div>
                        <motion.button
                            onClick={() => setShowAddModal(true)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold shadow-lg"
                        >
                            <Zap className="w-4 h-4" />
                            Add Device
                        </motion.button>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm text-white/60">{supportedCount} devices supported</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-white/60">100% local processing</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <WifiOff className="w-4 h-4 text-white/40" />
                            <span className="text-sm text-white/60">No cloud required</span>
                        </div>
                    </div>
                </motion.div>

                {/* Add Device Modal */}
                <AddDeviceModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onConnect={(id, name) => {
                        console.log('Connected:', id, name);
                        setShowAddModal(false);
                    }}
                />

                {/* Category Filter */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-2 mb-6"
                >
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                ${activeCategory === cat.id
                                    ? 'bg-white text-black'
                                    : 'bg-white/8 text-white/60 hover:bg-white/12 hover:text-white'
                                }
              `}
                        >
                            {cat.label}
                        </button>
                    ))}
                </motion.div>

                {/* Main Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Device List */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="lg:col-span-2 space-y-2"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredDevices.map((device, i) => (
                                <motion.div
                                    key={device.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <DeviceCard
                                        device={device}
                                        isSelected={selectedDevice.id === device.id}
                                        onClick={() => setSelectedDevice(device)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {/* Device Detail */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/4 p-6 backdrop-blur-sm"
                    >
                        <AnimatePresence mode="wait">
                            <DeviceDetailPanel key={selectedDevice.id} device={selectedDevice} />
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Bottom Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 p-4 rounded-2xl border border-white/8 bg-white/3 flex items-center gap-4"
                >
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-white/80">Missing your device?</p>
                        <p className="text-xs text-white/50 mt-0.5">
                            Most devices that export to CSV, JSON, or XML are compatible. Check the{' '}
                            <a href="/data-sources" className="text-blue-400 hover:underline">Data Sources</a>{' '}
                            page to manually upload files, or{' '}
                            <a href="https://github.com/mangeshraut712/Vitals.AI/issues" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                open an issue
                            </a>{' '}
                            to request a new integration.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
