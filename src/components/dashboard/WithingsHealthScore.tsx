import { motion } from "framer-motion";
import { useMemo } from "react";

interface WithingsHealthScoreProps {
    score: number | null;
    size?: number;
    strokeWidth?: number;
    showStatus?: boolean;
}

export function WithingsHealthScore({
    score,
    size = 180,
    strokeWidth = 12,
    showStatus = true,
}: WithingsHealthScoreProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const validScore = score ?? 0;
    const progress = Math.min(Math.max(validScore, 0), 100);
    const offset = circumference - (progress / 100) * circumference;

    const status = useMemo(() => {
        if (validScore >= 80) return { text: "Excellent", color: "text-emerald-400" };
        if (validScore >= 60) return { text: "Good", color: "text-sky-400" };
        if (validScore >= 40) return { text: "Fair", color: "text-amber-400" };
        return { text: "Needs Work", color: "text-rose-400" };
    }, [validScore]);

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative" style={{ width: size, height: size }}>
                {/* Background Track */}
                <svg
                    width={size}
                    height={size}
                    className="transform -rotate-90"
                >
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-muted/20"
                    />
                    {/* Progress Arc */}
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" /> {/* emerald */}
                            <stop offset="50%" stopColor="#06b6d4" /> {/* cyan */}
                            <stop offset="100%" stopColor="#3b82f6" /> {/* blue */}
                        </linearGradient>
                    </defs>
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="text-5xl font-bold tracking-tighter tabular-nums"
                    >
                        {score !== null ? score : "--"}
                    </motion.span>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">
                        / 100
                    </span>
                </div>
            </div>

            {showStatus && score !== null && (
                <div className="mt-4 text-center">
                    <p className={`text-lg font-semibold ${status.color}`}>
                        {status.text}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                        Based on your activity, sleep, and body composition.
                    </p>
                </div>
            )}
        </div>
    );
}
