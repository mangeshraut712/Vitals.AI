'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from 'recharts';
import { User, Users } from 'lucide-react';

// ===== Types =====

type Gender = 'male' | 'female';

interface SegmentData {
    segment: string;
    fatPercent: number;
    musclePercent: number;
    optimalFatMin: number;
    optimalFatMax: number;
    optimalMuscleMin: number;
    optimalMuscleMax: number;
}

interface BodyCompositionData {
    gender: Gender;
    age: number;
    weight: number; // kg
    height: number; // cm
    totalBodyFat: number; // %
    totalMuscleMass: number; // kg
    boneMass: number; // kg
    waterPercent: number; // %
    visceralFatLevel: number;
    bmi: number;
    basalMetabolicRate: number; // kcal
    segments: SegmentData[];
}

// ===== Reference ranges by gender =====

const OPTIMAL_RANGES: Record<Gender, Record<string, { fatMin: number; fatMax: number; muscleMin: number; muscleMax: number }>> = {
    male: {
        'Right Arm': { fatMin: 8, fatMax: 18, muscleMin: 55, muscleMax: 70 },
        'Left Arm': { fatMin: 8, fatMax: 18, muscleMin: 55, muscleMax: 70 },
        'Trunk': { fatMin: 10, fatMax: 20, muscleMin: 45, muscleMax: 60 },
        'Right Leg': { fatMin: 12, fatMax: 22, muscleMin: 50, muscleMax: 65 },
        'Left Leg': { fatMin: 12, fatMax: 22, muscleMin: 50, muscleMax: 65 },
    },
    female: {
        'Right Arm': { fatMin: 18, fatMax: 28, muscleMin: 40, muscleMax: 55 },
        'Left Arm': { fatMin: 18, fatMax: 28, muscleMin: 40, muscleMax: 55 },
        'Trunk': { fatMin: 20, fatMax: 30, muscleMin: 35, muscleMax: 50 },
        'Right Leg': { fatMin: 22, fatMax: 32, muscleMin: 40, muscleMax: 55 },
        'Left Leg': { fatMin: 22, fatMax: 32, muscleMin: 40, muscleMax: 55 },
    },
};

// ===== Demo data =====

function getDemoData(gender: Gender): BodyCompositionData {
    const isMale = gender === 'male';
    return {
        gender,
        age: 32,
        weight: isMale ? 78 : 62,
        height: isMale ? 178 : 165,
        totalBodyFat: isMale ? 16.2 : 24.8,
        totalMuscleMass: isMale ? 36.4 : 24.1,
        boneMass: isMale ? 3.2 : 2.4,
        waterPercent: isMale ? 62 : 55,
        visceralFatLevel: isMale ? 6 : 4,
        bmi: isMale ? 24.6 : 22.8,
        basalMetabolicRate: isMale ? 1820 : 1420,
        segments: [
            {
                segment: 'Right Arm',
                fatPercent: isMale ? 14.2 : 22.4,
                musclePercent: isMale ? 62.1 : 47.3,
                ...OPTIMAL_RANGES[gender]['Right Arm'],
                optimalFatMin: OPTIMAL_RANGES[gender]['Right Arm'].fatMin,
                optimalFatMax: OPTIMAL_RANGES[gender]['Right Arm'].fatMax,
                optimalMuscleMin: OPTIMAL_RANGES[gender]['Right Arm'].muscleMin,
                optimalMuscleMax: OPTIMAL_RANGES[gender]['Right Arm'].muscleMax,
            },
            {
                segment: 'Left Arm',
                fatPercent: isMale ? 14.8 : 23.1,
                musclePercent: isMale ? 61.4 : 46.8,
                optimalFatMin: OPTIMAL_RANGES[gender]['Left Arm'].fatMin,
                optimalFatMax: OPTIMAL_RANGES[gender]['Left Arm'].fatMax,
                optimalMuscleMin: OPTIMAL_RANGES[gender]['Left Arm'].muscleMin,
                optimalMuscleMax: OPTIMAL_RANGES[gender]['Left Arm'].muscleMax,
            },
            {
                segment: 'Trunk',
                fatPercent: isMale ? 17.6 : 26.2,
                musclePercent: isMale ? 51.3 : 40.1,
                optimalFatMin: OPTIMAL_RANGES[gender]['Trunk'].fatMin,
                optimalFatMax: OPTIMAL_RANGES[gender]['Trunk'].fatMax,
                optimalMuscleMin: OPTIMAL_RANGES[gender]['Trunk'].muscleMin,
                optimalMuscleMax: OPTIMAL_RANGES[gender]['Trunk'].muscleMax,
            },
            {
                segment: 'Right Leg',
                fatPercent: isMale ? 18.4 : 28.6,
                musclePercent: isMale ? 55.2 : 43.7,
                optimalFatMin: OPTIMAL_RANGES[gender]['Right Leg'].fatMin,
                optimalFatMax: OPTIMAL_RANGES[gender]['Right Leg'].fatMax,
                optimalMuscleMin: OPTIMAL_RANGES[gender]['Right Leg'].muscleMin,
                optimalMuscleMax: OPTIMAL_RANGES[gender]['Right Leg'].muscleMax,
            },
            {
                segment: 'Left Leg',
                fatPercent: isMale ? 18.1 : 28.2,
                musclePercent: isMale ? 55.8 : 44.2,
                optimalFatMin: OPTIMAL_RANGES[gender]['Left Leg'].fatMin,
                optimalFatMax: OPTIMAL_RANGES[gender]['Left Leg'].fatMax,
                optimalMuscleMin: OPTIMAL_RANGES[gender]['Left Leg'].muscleMin,
                optimalMuscleMax: OPTIMAL_RANGES[gender]['Left Leg'].muscleMax,
            },
        ],
    };
}

// ===== Helper =====

function getStatus(value: number, min: number, max: number): 'optimal' | 'low' | 'high' {
    if (value < min) return 'low';
    if (value > max) return 'high';
    return 'optimal';
}

const STATUS_COLORS = {
    optimal: '#10b981',
    low: '#60a5fa',
    high: '#f59e0b',
};

// ===== Body Silhouette SVG =====

function BodySilhouette({
    gender,
    segments,
    selectedSegment,
    onSelectSegment,
}: {
    gender: Gender;
    segments: SegmentData[];
    selectedSegment: string | null;
    onSelectSegment: (seg: string) => void;
}) {
    const getSegColor = (segName: string) => {
        const seg = segments.find(s => s.segment === segName);
        if (!seg) return '#ffffff20';
        const fatStatus = getStatus(seg.fatPercent, seg.optimalFatMin, seg.optimalFatMax);
        const color = STATUS_COLORS[fatStatus];
        return selectedSegment === segName ? color : `${color}60`;
    };

    const isFemale = gender === 'female';

    return (
        <svg viewBox="0 0 120 280" className="w-full h-full" style={{ maxHeight: 320 }}>
            {/* Head */}
            <ellipse cx="60" cy="22" rx={isFemale ? 14 : 15} ry="18" fill="#ffffff15" stroke="#ffffff20" strokeWidth="1" />

            {/* Neck */}
            <rect x="54" y="38" width="12" height="10" rx="4" fill="#ffffff10" />

            {/* Right Arm */}
            <motion.path
                d={isFemale
                    ? 'M 38 52 Q 28 80 26 120 Q 28 130 34 128 Q 40 126 40 116 Q 42 80 46 56 Z'
                    : 'M 36 52 Q 24 80 22 122 Q 24 132 30 130 Q 36 128 38 118 Q 40 80 44 56 Z'
                }
                fill={getSegColor('Right Arm')}
                stroke={selectedSegment === 'Right Arm' ? '#ffffff60' : '#ffffff15'}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-300"
                onClick={() => onSelectSegment('Right Arm')}
                whileHover={{ scale: 1.05 }}
            />

            {/* Left Arm */}
            <motion.path
                d={isFemale
                    ? 'M 82 52 Q 92 80 94 120 Q 92 130 86 128 Q 80 126 80 116 Q 78 80 74 56 Z'
                    : 'M 84 52 Q 96 80 98 122 Q 96 132 90 130 Q 84 128 82 118 Q 80 80 76 56 Z'
                }
                fill={getSegColor('Left Arm')}
                stroke={selectedSegment === 'Left Arm' ? '#ffffff60' : '#ffffff15'}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-300"
                onClick={() => onSelectSegment('Left Arm')}
                whileHover={{ scale: 1.05 }}
            />

            {/* Trunk */}
            <motion.path
                d={isFemale
                    ? 'M 44 50 Q 38 70 36 90 Q 38 110 44 118 Q 52 126 60 126 Q 68 126 76 118 Q 82 110 84 90 Q 82 70 76 50 Q 68 44 60 44 Q 52 44 44 50 Z'
                    : 'M 42 50 Q 36 70 34 90 Q 36 112 42 120 Q 50 128 60 128 Q 70 128 78 120 Q 84 112 86 90 Q 84 70 78 50 Q 70 44 60 44 Q 50 44 42 50 Z'
                }
                fill={getSegColor('Trunk')}
                stroke={selectedSegment === 'Trunk' ? '#ffffff60' : '#ffffff15'}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-300"
                onClick={() => onSelectSegment('Trunk')}
                whileHover={{ scale: 1.02 }}
            />

            {/* Right Leg */}
            <motion.path
                d={isFemale
                    ? 'M 44 124 Q 40 150 38 180 Q 36 210 38 240 Q 40 252 46 252 Q 52 252 54 240 Q 56 210 56 180 Q 56 150 54 124 Z'
                    : 'M 42 126 Q 38 152 36 182 Q 34 212 36 242 Q 38 254 44 254 Q 50 254 52 242 Q 54 212 54 182 Q 54 152 52 126 Z'
                }
                fill={getSegColor('Right Leg')}
                stroke={selectedSegment === 'Right Leg' ? '#ffffff60' : '#ffffff15'}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-300"
                onClick={() => onSelectSegment('Right Leg')}
                whileHover={{ scale: 1.03 }}
            />

            {/* Left Leg */}
            <motion.path
                d={isFemale
                    ? 'M 76 124 Q 80 150 82 180 Q 84 210 82 240 Q 80 252 74 252 Q 68 252 66 240 Q 64 210 64 180 Q 64 150 66 124 Z'
                    : 'M 78 126 Q 82 152 84 182 Q 86 212 84 242 Q 82 254 76 254 Q 70 254 68 242 Q 66 212 66 182 Q 66 152 68 126 Z'
                }
                fill={getSegColor('Left Leg')}
                stroke={selectedSegment === 'Left Leg' ? '#ffffff60' : '#ffffff15'}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-300"
                onClick={() => onSelectSegment('Left Leg')}
                whileHover={{ scale: 1.03 }}
            />

            {/* Segment labels */}
            <text x="20" y="90" fontSize="6" fill="#ffffff50" textAnchor="middle">R. Arm</text>
            <text x="100" y="90" fontSize="6" fill="#ffffff50" textAnchor="middle">L. Arm</text>
            <text x="60" y="88" fontSize="6" fill="#ffffff50" textAnchor="middle">Trunk</text>
            <text x="45" y="200" fontSize="6" fill="#ffffff50" textAnchor="middle">R. Leg</text>
            <text x="75" y="200" fontSize="6" fill="#ffffff50" textAnchor="middle">L. Leg</text>
        </svg>
    );
}

// ===== Segment Detail =====

function SegmentDetail({ segment, gender }: { segment: SegmentData; gender: Gender }) {
    const fatStatus = getStatus(segment.fatPercent, segment.optimalFatMin, segment.optimalFatMax);
    const muscleStatus = getStatus(segment.musclePercent, segment.optimalMuscleMin, segment.optimalMuscleMax);

    const barData = [
        { name: 'Fat %', value: segment.fatPercent, fill: STATUS_COLORS[fatStatus] },
        { name: 'Muscle %', value: segment.musclePercent, fill: '#60a5fa' },
    ];

    return (
        <motion.div
            key={segment.segment}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">{segment.segment}</h3>
                <span className="text-xs text-white/40 capitalize">{gender} reference ranges</span>
            </div>

            {/* Fat & Muscle bars */}
            <div className="space-y-3">
                {[
                    {
                        label: 'Body Fat',
                        value: segment.fatPercent,
                        min: segment.optimalFatMin,
                        max: segment.optimalFatMax,
                        status: fatStatus,
                        color: STATUS_COLORS[fatStatus],
                    },
                    {
                        label: 'Muscle Mass',
                        value: segment.musclePercent,
                        min: segment.optimalMuscleMin,
                        max: segment.optimalMuscleMax,
                        status: muscleStatus,
                        color: '#60a5fa',
                    },
                ].map(metric => (
                    <div key={metric.label}>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs text-white/60">{metric.label}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white tabular-nums">{metric.value}%</span>
                                <span
                                    className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                                    style={{
                                        background: `${metric.color}20`,
                                        color: metric.color,
                                        border: `1px solid ${metric.color}30`,
                                    }}
                                >
                                    {metric.status}
                                </span>
                            </div>
                        </div>
                        {/* Progress bar with optimal range indicator */}
                        <div className="relative h-2 bg-white/8 rounded-full overflow-hidden">
                            {/* Optimal range highlight */}
                            <div
                                className="absolute top-0 bottom-0 opacity-20 rounded-full"
                                style={{
                                    left: `${metric.min}%`,
                                    width: `${metric.max - metric.min}%`,
                                    background: metric.color,
                                }}
                            />
                            {/* Value bar */}
                            <motion.div
                                className="absolute top-0 left-0 bottom-0 rounded-full"
                                style={{ background: metric.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(metric.value, 100)}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-white/25">Optimal: {metric.min}–{metric.max}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mini bar chart */}
            <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                            itemStyle={{ color: 'white' }}
                            formatter={(v: number | string | Array<number | string> | undefined) => [`${v ?? ''}%`, '']}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {barData.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

// ===== Main Component =====

interface SegmentalBodyCompositionProps {
    data?: Partial<BodyCompositionData>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SegmentalBodyComposition({ data: _data }: SegmentalBodyCompositionProps) {
    const [gender, setGender] = useState<Gender>('male');
    const [selectedSegment, setSelectedSegment] = useState<string | null>('Trunk');

    const compositionData = getDemoData(gender);
    const selectedSeg = compositionData.segments.find(s => s.segment === selectedSegment);

    // Radar data
    const radarData = compositionData.segments.map(seg => ({
        segment: seg.segment.replace(' ', '\n'),
        fat: seg.fatPercent,
        muscle: seg.musclePercent,
    }));

    const overallMetrics = [
        { label: 'Total Body Fat', value: `${compositionData.totalBodyFat}%`, color: '#f59e0b' },
        { label: 'Muscle Mass', value: `${compositionData.totalMuscleMass} kg`, color: '#60a5fa' },
        { label: 'Bone Mass', value: `${compositionData.boneMass} kg`, color: '#a78bfa' },
        { label: 'Body Water', value: `${compositionData.waterPercent}%`, color: '#06b6d4' },
        { label: 'Visceral Fat', value: `Level ${compositionData.visceralFatLevel}`, color: '#ef4444' },
        { label: 'BMR', value: `${compositionData.basalMetabolicRate} kcal`, color: '#10b981' },
    ];

    return (
        <div className="space-y-6">
            {/* Gender toggle */}
            <div className="flex items-center gap-3">
                <span className="text-xs text-white/40 font-medium">Profile:</span>
                <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
                    {(['male', 'female'] as Gender[]).map(g => (
                        <button
                            key={g}
                            onClick={() => setGender(g)}
                            className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${gender === g ? 'bg-white text-black' : 'text-white/50 hover:text-white'}
              `}
                        >
                            {g === 'male' ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Body silhouette */}
                <div className="flex flex-col items-center">
                    <p className="text-xs text-white/30 mb-3 text-center">Tap a segment to inspect</p>
                    <div className="w-40 h-72">
                        <BodySilhouette
                            gender={gender}
                            segments={compositionData.segments}
                            selectedSegment={selectedSegment}
                            onSelectSegment={setSelectedSegment}
                        />
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 mt-3">
                        {Object.entries(STATUS_COLORS).map(([status, color]) => (
                            <div key={status} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                <span className="text-xs text-white/40 capitalize">{status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Segment detail */}
                <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
                    <AnimatePresence mode="wait">
                        {selectedSeg ? (
                            <SegmentDetail key={selectedSeg.segment} segment={selectedSeg} gender={gender} />
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-center h-full text-white/30 text-sm"
                            >
                                Select a body segment
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Radar chart */}
                <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">Segmental Overview</h3>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                <PolarAngleAxis dataKey="segment" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} />
                                <Radar name="Fat %" dataKey="fat" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} />
                                <Radar name="Muscle %" dataKey="muscle" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} strokeWidth={1.5} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 bg-amber-400" />
                            <span className="text-xs text-white/40">Fat %</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 bg-blue-400" />
                            <span className="text-xs text-white/40">Muscle %</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overall metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {overallMetrics.map(metric => (
                    <motion.div
                        key={metric.label}
                        whileHover={{ scale: 1.02 }}
                        className="rounded-xl border border-white/8 bg-white/4 p-3 text-center"
                    >
                        <div className="text-base font-bold text-white tabular-nums" style={{ color: metric.color }}>
                            {metric.value}
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">{metric.label}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
