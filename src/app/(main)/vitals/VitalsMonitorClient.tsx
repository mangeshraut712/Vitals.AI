'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    Wind,
    Droplets,
    Thermometer,
    Brain,
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    CheckCircle,
    Upload,
    FileText,
    Zap,
    BarChart3,
    type LucideIcon,
} from 'lucide-react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';

// ===== Types =====

interface VitalReading {
    time: string;
    value: number;
}

interface VitalMetric {
    id: string;
    label: string;
    unit: string;
    value: number | null;
    trend: 'up' | 'down' | 'stable';
    status: 'optimal' | 'normal' | 'warning' | 'critical';
    icon: LucideIcon;
    color: string;
    gradientId: string;
    history: VitalReading[];
    optimalRange: [number, number];
    description: string;
}

// ===== Mock data generator for demo =====

function generateHistory(base: number, variance: number, points: number = 24): VitalReading[] {
    const now = new Date();
    return Array.from({ length: points }, (_, i) => ({
        time: new Date(now.getTime() - (points - 1 - i) * 3600000)
            .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        value: Math.round((base + (Math.random() - 0.5) * variance * 2) * 10) / 10,
    }));
}

// ===== Custom Tooltip =====

function CustomTooltip({ active, payload, label, unit }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
    unit: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1a1a2e]/95 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
            <p className="text-white/50 mb-0.5">{label}</p>
            <p className="text-white font-semibold">{payload[0].value} <span className="text-white/50 font-normal">{unit}</span></p>
        </div>
    );
}

// ===== Vital Card =====

function VitalCard({
    metric,
    isSelected,
    onClick,
}: {
    metric: VitalMetric;
    isSelected: boolean;
    onClick: () => void;
}) {
    const Icon = metric.icon;
    const statusColors = {
        optimal: '#10b981',
        normal: '#60a5fa',
        warning: '#f59e0b',
        critical: '#ef4444',
    };
    const statusColor = statusColors[metric.status];

    const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
        relative w-full text-left p-5 rounded-2xl border transition-all duration-300 overflow-hidden
        ${isSelected
                    ? 'border-white/20 bg-white/8'
                    : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5'
                }
      `}
        >
            {/* Glow effect */}
            {isSelected && (
                <div
                    className="absolute inset-0 opacity-10 rounded-2xl"
                    style={{ background: `radial-gradient(circle at 30% 50%, ${metric.color}, transparent 70%)` }}
                />
            )}

            <div className="relative">
                <div className="flex items-start justify-between mb-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${metric.color}20`, border: `1px solid ${metric.color}30` }}
                    >
                        <Icon className="w-[18px] h-[18px]" color={metric.color} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ background: statusColor }}
                        />
                        <TrendIcon className="w-3.5 h-3.5 text-white/40" />
                    </div>
                </div>

                <div className="mb-1">
                    <span className="text-2xl font-bold text-white tabular-nums">
                        {metric.value ?? '—'}
                    </span>
                    <span className="text-sm text-white/40 ml-1.5">{metric.unit}</span>
                </div>

                <p className="text-xs text-white/50">{metric.label}</p>

                {/* Mini sparkline */}
                <div className="mt-3 h-10 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metric.history.slice(-12)}>
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={metric.color}
                                strokeWidth={1.5}
                                dot={false}
                                strokeOpacity={0.8}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </motion.button>
    );
}

// ===== Detail Chart =====

function VitalDetailChart({ metric }: { metric: VitalMetric }) {
    const [min, max] = metric.optimalRange;

    return (
        <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-white">{metric.label}</h2>
                    <p className="text-xs text-white/40 mt-0.5">{metric.description}</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-white tabular-nums">
                        {metric.value}
                        <span className="text-base text-white/40 ml-1.5 font-normal">{metric.unit}</span>
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                        Optimal: {min}–{max} {metric.unit}
                    </div>
                </div>
            </div>

            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metric.history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={metric.gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={metric.color} stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="time"
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            interval={5}
                        />
                        <YAxis
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip unit={metric.unit} />} />
                        <ReferenceLine y={min} stroke={metric.color} strokeDasharray="4 4" strokeOpacity={0.4} />
                        <ReferenceLine y={max} stroke={metric.color} strokeDasharray="4 4" strokeOpacity={0.4} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={metric.color}
                            strokeWidth={2}
                            fill={`url(#${metric.gradientId})`}
                            dot={false}
                            activeDot={{ r: 4, fill: metric.color, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Status indicators */}
            <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                    { label: '24h Min', value: Math.min(...metric.history.map(h => h.value)) },
                    { label: '24h Avg', value: Math.round(metric.history.reduce((a, b) => a + b.value, 0) / metric.history.length * 10) / 10 },
                    { label: '24h Max', value: Math.max(...metric.history.map(h => h.value)) },
                ].map(stat => (
                    <div key={stat.label} className="bg-white/4 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-white tabular-nums">{stat.value}</div>
                        <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

// ===== Upload Panel =====

function DataUploadPanel() {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        const names = files.map(f => f.name);
        setUploadedFiles(prev => [...prev, ...names]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setUploadedFiles(prev => [...prev, ...files.map(f => f.name)]);
    };

    const handleAnalyze = () => {
        if (uploadedFiles.length === 0) return;
        setAnalyzing(true);
        setAnalysisResult(null);
        // Simulate AI analysis
        setTimeout(() => {
            setAnalyzing(false);
            setAnalysisResult(
                `Analysis complete for ${uploadedFiles.length} file(s). Your HRV trend shows a 12% improvement over the last 30 days. Resting heart rate is within optimal range (58 bpm). Sleep consistency score: 78/100. Recommendation: Increase recovery days to maintain HRV gains.`
            );
        }, 2500);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Upload className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Upload Health Data for AI Analysis</h3>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
          relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200
          ${isDragging ? 'border-blue-400/60 bg-blue-400/8' : 'border-white/15 hover:border-white/25 hover:bg-white/3'}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".csv,.json,.xml,.txt,.pdf,.zip"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto mb-2 text-white/30" />
                <p className="text-sm font-medium text-white/60">Drop files or click to upload</p>
                <p className="text-xs text-white/30 mt-1">CSV, JSON, XML, PDF, ZIP — any health export</p>
            </div>

            {/* Uploaded files */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                    {uploadedFiles.map((name, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8">
                            <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="text-xs text-white/70 truncate flex-1">{name}</span>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        </div>
                    ))}
                </div>
            )}

            {/* Analyze button */}
            {uploadedFiles.length > 0 && (
                <motion.button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {analyzing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Analyzing with AI...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4" />
                            Analyze with AI Coach
                        </>
                    )}
                </motion.button>
            )}

            {/* Analysis result */}
            <AnimatePresence>
                {analysisResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                    >
                        <div className="flex items-start gap-2">
                            <BarChart3 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-white/70 leading-relaxed">{analysisResult}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ===== Main Component =====

export default function VitalsMonitorClient() {
    const [selectedMetricId, setSelectedMetricId] = useState('heart_rate');

    const metrics: VitalMetric[] = [
        {
            id: 'heart_rate',
            label: 'Heart Rate',
            unit: 'bpm',
            value: 68,
            trend: 'stable',
            status: 'optimal',
            icon: Heart,
            color: '#ef4444',
            gradientId: 'hrGrad',
            history: generateHistory(68, 8),
            optimalRange: [60, 100],
            description: '24-hour continuous monitoring via optical sensor',
        },
        {
            id: 'rhr',
            label: 'Resting Heart Rate',
            unit: 'bpm',
            value: 52,
            trend: 'down',
            status: 'optimal',
            icon: Activity,
            color: '#f97316',
            gradientId: 'rhrGrad',
            history: generateHistory(52, 4),
            optimalRange: [40, 60],
            description: 'Lowest heart rate during sleep — key longevity marker',
        },
        {
            id: 'respiratory_rate',
            label: 'Respiratory Rate',
            unit: 'rpm',
            value: 14,
            trend: 'stable',
            status: 'optimal',
            icon: Wind,
            color: '#06b6d4',
            gradientId: 'rrGrad',
            history: generateHistory(14, 2),
            optimalRange: [12, 20],
            description: 'Breaths per minute during sleep — WHOOP 5.0 sensor',
        },
        {
            id: 'spo2',
            label: 'Blood Oxygen',
            unit: '%',
            value: 97,
            trend: 'stable',
            status: 'optimal',
            icon: Droplets,
            color: '#3b82f6',
            gradientId: 'spo2Grad',
            history: generateHistory(97, 1.5),
            optimalRange: [95, 100],
            description: 'SpO₂ — oxygen saturation measured overnight',
        },
        {
            id: 'skin_temp',
            label: 'Skin Temperature',
            unit: '°C',
            value: 36.1,
            trend: 'stable',
            status: 'normal',
            icon: Thermometer,
            color: '#a78bfa',
            gradientId: 'tempGrad',
            history: generateHistory(36.1, 0.4),
            optimalRange: [35.5, 37.0],
            description: 'Wrist skin temperature deviation from baseline',
        },
        {
            id: 'stress',
            label: 'Stress Index',
            unit: '/100',
            value: 28,
            trend: 'down',
            status: 'optimal',
            icon: Brain,
            color: '#10b981',
            gradientId: 'stressGrad',
            history: generateHistory(28, 12),
            optimalRange: [0, 40],
            description: 'Autonomic nervous system stress derived from HRV',
        },
        {
            id: 'blood_pressure',
            label: 'Blood Pressure',
            unit: 'mmHg',
            value: 118,
            trend: 'stable',
            status: 'optimal',
            icon: Activity,
            color: '#f59e0b',
            gradientId: 'bpGrad',
            history: generateHistory(118, 6),
            optimalRange: [90, 120],
            description: 'Systolic BP estimated via pulse transit time (PTT)',
        },
        {
            id: 'hrv',
            label: 'HRV (RMSSD)',
            unit: 'ms',
            value: 72,
            trend: 'up',
            status: 'optimal',
            icon: Zap,
            color: '#8b5cf6',
            gradientId: 'hrvGrad',
            history: generateHistory(72, 15),
            optimalRange: [50, 120],
            description: 'Heart rate variability — primary recovery biomarker',
        },
    ];

    const selectedMetric = metrics.find(m => m.id === selectedMetricId) ?? metrics[0];

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Ambient background */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-500/4 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/4 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Vitals Monitor</h1>
                                    <p className="text-white/40 text-sm">WHOOP 5.0 · Advanced Biosensor Suite · 2026</p>
                                </div>
                            </div>
                        </div>

                        {/* Status summary */}
                        <div className="flex items-center gap-3">
                            {criticalCount > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/25">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                    <span className="text-xs font-medium text-red-400">{criticalCount} critical</span>
                                </div>
                            )}
                            {warningCount > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-xs font-medium text-amber-400">{warningCount} warnings</span>
                                </div>
                            )}
                            {criticalCount === 0 && warningCount === 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-xs font-medium text-emerald-400">All vitals normal</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Main layout */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left: Vital cards grid */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="xl:col-span-2"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                            {metrics.map((metric, i) => (
                                <motion.div
                                    key={metric.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * i }}
                                >
                                    <VitalCard
                                        metric={metric}
                                        isSelected={selectedMetricId === metric.id}
                                        onClick={() => setSelectedMetricId(metric.id)}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* Detail chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl border border-white/10 bg-white/4 p-6 backdrop-blur-sm"
                        >
                            <AnimatePresence mode="wait">
                                <VitalDetailChart key={selectedMetric.id} metric={selectedMetric} />
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>

                    {/* Right: Upload + AI Analysis */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        {/* AI Upload Panel */}
                        <div className="rounded-2xl border border-white/10 bg-white/4 p-5 backdrop-blur-sm">
                            <DataUploadPanel />
                        </div>

                        {/* WHOOP Coach tips */}
                        <div className="rounded-2xl border border-white/10 bg-white/4 p-5 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Brain className="w-4 h-4 text-purple-400" />
                                <h3 className="text-sm font-semibold text-white">AI Health Coach</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25">WHOOP 5.0</span>
                            </div>

                            <div className="space-y-3">
                                {[
                                    {
                                        icon: '🟢',
                                        title: 'Recovery: Excellent',
                                        body: 'HRV 72ms is 18% above your baseline. Green day — push hard.',
                                    },
                                    {
                                        icon: '💤',
                                        title: 'Sleep Debt: Low',
                                        body: '7.4h avg over 7 days. Maintain consistency for peak HRV.',
                                    },
                                    {
                                        icon: '🫁',
                                        title: 'RR Trend: Stable',
                                        body: '14 rpm overnight. No respiratory anomalies detected.',
                                    },
                                    {
                                        icon: '🌡️',
                                        title: 'Temp Deviation: +0.1°C',
                                        body: 'Within normal range. No illness signal detected.',
                                    },
                                ].map((tip, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + i * 0.08 }}
                                        className="flex gap-3 p-3 rounded-xl bg-white/4 border border-white/6"
                                    >
                                        <span className="text-base flex-shrink-0 mt-0.5">{tip.icon}</span>
                                        <div>
                                            <p className="text-xs font-semibold text-white">{tip.title}</p>
                                            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{tip.body}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
