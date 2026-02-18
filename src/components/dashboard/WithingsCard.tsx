import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface WithingsCardProps {
    title: string;
    value: string | number;
    unit?: string;
    status?: string;
    statusColor?: string;
    trend?: "up" | "down" | "stable" | "neutral";
    date?: string;
    href?: string;
    children?: ReactNode; // For graph/sparkline
    className?: string;
}

export function WithingsCard({
    title,
    value,
    unit,
    status,
    statusColor = "text-muted-foreground",
    trend,
    date,
    href,
    children,
    className = "",
}: WithingsCardProps) {
    if (href) {
        return (
            <Link
                href={href}
                className={`vitals-card bg-[oklch(0.12_0_0)] block overflow-hidden relative group hover:bg-[oklch(0.14_0_0)] transition-colors ${className}`}
            >
                {renderContent(title, value, unit, status, statusColor, trend, date, children)}
            </Link>
        );
    }

    return (
        <div
            className={`vitals-card bg-[oklch(0.12_0_0)] overflow-hidden relative group hover:bg-[oklch(0.14_0_0)] transition-colors ${className}`}
        >
            {renderContent(title, value, unit, status, statusColor, trend, date, children)}
        </div>
    );
}

function renderContent(
    title: string,
    value: string | number,
    unit?: string,
    status?: string,
    statusColor: string = "text-muted-foreground",
    trend?: "up" | "down" | "stable" | "neutral",
    date?: string,
    children?: ReactNode
) {
    return (
        <>
            <div className="p-5 pb-0 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wide">
                            {title}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {date && (
                            <span className="text-xs text-muted-foreground font-medium">
                                {date}
                            </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                </div>

                {/* Main Value */}
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-white tabular-nums">
                        {value}
                    </span>
                    {unit && (
                        <span className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider ml-1">
                            {unit}
                        </span>
                    )}
                </div>

                {/* Status / Trend */}
                <div className="mt-1 h-6 flex items-center">
                    {(status || trend) && (
                        <div className="flex items-center gap-1.5">
                            {trend === "up" && <TrendingUp className="w-4 h-4 text-rose-400" />}
                            {trend === "down" && <TrendingDown className="w-4 h-4 text-emerald-400" />}
                            {trend === "stable" && <ArrowRight className="w-4 h-4 text-sky-400 rotate-0" />}

                            {status && (
                                <span className={`text-sm font-medium ${statusColor}`}>
                                    {status}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Graph Area */}
            <div className="mt-4 w-full h-16 relative px-0">
                {children}
            </div>
        </>
    );
}
