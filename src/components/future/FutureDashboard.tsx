'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Share2 } from 'lucide-react';
import { SUPPORTED_DEVICES } from '@/features/sync/types';
import AddDeviceModal from './AddDeviceModal';
import GlucoseChart from './GlucoseChart';

interface DashboardStats {
    healthScore: number;
    prevHealthScore: number;
    hrvStatus: string;
    glucose: {
        current: number;
        trend: string;
        history: number[];
    };
    coaching: {
        message: string;
        metrics: {
            sleep: number;
            hrv: number;
        };
    };
    community: {
        rank: string;
        metric: string;
    };
    devices: typeof SUPPORTED_DEVICES;
}

export default function FutureDashboard(): React.JSX.Element {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

    type DeviceType = DashboardStats['devices'][number]['type'];

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/future/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const handleConnectDevice = (name: string, type: string) => {
        if (!stats) return;
        setStats(prev => {
            if (!prev) return null;
            return {
                ...prev,
                devices: [
                    ...prev.devices,
                    { name, type: type as DeviceType, status: 'connected' as const, lastSync: new Date() }
                ]
            };
        });
    };

    if (loading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Syncing Vitals 2.0...</p>
                </div>
            </div>
        );
    }

    if (!stats) return <div className="p-12 text-center text-muted-foreground">Failed to load data</div>;

    const scoreColor = stats.healthScore >= 80 ? 'text-emerald-400' : stats.healthScore >= 70 ? 'text-yellow-400' : 'text-rose-400';
    const ringColor = stats.healthScore >= 80 ? 'border-emerald-500/50' : stats.healthScore >= 70 ? 'border-yellow-500/50' : 'border-rose-500/50';

    return (
        <div className="w-full bg-background min-h-screen text-foreground space-y-12 p-6 lg:p-12 font-sans transition-colors duration-300">
            <AddDeviceModal
                isOpen={isDeviceModalOpen}
                onClose={() => setIsDeviceModalOpen(false)}
                onConnect={handleConnectDevice}
            />

            {/* Hero Section: Clean, Minimalist, Data-First */}
            <section className="relative w-full flex flex-col items-center justify-center text-center space-y-8 py-12">

                {/* Dynamic Health Score Ring - Minimalist Apple Style */}
                <div className="relative">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`relative flex items-center justify-center w-56 h-56 rounded-full bg-background border-[6px] ${ringColor} shadow-2xl`}
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">Health Score</span>
                            <span className={`text-8xl font-medium tracking-tighter ${scoreColor}`}>
                                {stats.healthScore}
                            </span>
                        </div>
                    </motion.div>
                </div>

                <div className="max-w-xl mx-auto px-4 space-y-3">
                    <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                        {stats.hrvStatus === 'peak' ? 'Optimal State' : 'Recovery Focus'}
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        {stats.healthScore >= 80
                            ? "Your biometrics are optimized. You're primed for high performance."
                            : "Your recovery metrics are slightly suppressed. Prioritize rest today."}
                    </p>
                </div>
            </section>

            {/* Grid: Clean Cards with Ample Whitespace */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Continuous Glucose Monitoring */}
                <div className="group relative p-8 bg-card border border-border rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                            <h3 className="text-base font-semibold text-foreground mb-1">Glucose</h3>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Live Stream</span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${stats.glucose.trend === 'stable' ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`} />
                    </div>
                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-4xl font-semibold tracking-tight">{stats.glucose.current}</span>
                        <span className="text-sm text-muted-foreground">mg/dL</span>
                    </div>
                    <GlucoseChart data={stats.glucose.history} />
                </div>

                {/* AI Health Coach */}
                <div className="group relative p-8 bg-card border border-border rounded-[2rem] shadow-sm hover:shadow-md transition-all col-span-1 md:col-span-2 lg:col-span-2 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-base font-semibold text-foreground mb-1">Vitals Coach</h3>
                            <p className="text-sm text-muted-foreground">Analyzing {stats.devices.length} sources</p>
                        </div>
                        <button className="text-sm bg-primary text-primary-foreground px-5 py-2 rounded-full font-medium hover:opacity-90 transition-opacity">
                            Insights
                        </button>
                    </div>
                    <p className="max-w-none text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
                        {stats.coaching.message}
                    </p>
                </div>

                {/* Social Connection */}
                <div className="group relative p-8 bg-card border border-border rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-base font-semibold text-foreground">Community</h3>
                        <Share2 className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="text-3xl font-semibold tracking-tight mb-2">{stats.community.rank}</div>
                            <p className="text-sm text-muted-foreground">in recovery this week</p>
                        </div>

                        <div className="flex -space-x-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-medium text-secondary-foreground">
                                    User
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="w-full mt-6 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium py-3 rounded-xl transition-colors">
                        Challenge
                    </button>
                </div>
            </div>

            {/* Device Management */}
            <section className="pt-12 border-t border-border">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">Ecosystem</h2>
                    <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full font-medium">Auto-Sync Active</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {stats.devices.map((device) => (
                        <div key={device.name} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border space-y-3 hover:border-foreground/20 transition-colors">
                            <div className={`w-2.5 h-2.5 rounded-full ${device.status === 'connected' ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                            <div className="text-center">
                                <div className="text-sm font-medium text-foreground">{device.name}</div>
                                <div className="text-xs text-muted-foreground capitalize mt-1">{device.status}</div>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => setIsDeviceModalOpen(true)}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-all space-y-3"
                    >
                        <Zap className="w-5 h-5" />
                        <span className="text-sm font-medium">Add Device</span>
                    </button>
                </div>
            </section>
        </div>
    );
}
