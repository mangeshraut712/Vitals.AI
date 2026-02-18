'use client';

import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface GlucoseChartProps {
    data: number[];
}

export default function GlucoseChart({ data }: GlucoseChartProps) {
    const chartData = data.map((value, i) => ({ i, value }));

    return (
        <div className="h-16 w-full -mx-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorGlucose)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
