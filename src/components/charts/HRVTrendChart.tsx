'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { STATUS_COLORS } from '@/lib/design/tokens';

interface HRVTrendChartProps {
    data: Array<{
        dateLabel: string;
        hrv: number;
    }>;
}

export default function HRVTrendChart({ data }: HRVTrendChartProps) {
    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                        formatter={(value) => [`${value ?? 0} ms`, 'HRV']}
                    />
                    <ReferenceLine
                        y={60}
                        stroke={STATUS_COLORS.optimal.base}
                        strokeDasharray="5 5"
                        label={{ value: 'Optimal', fill: STATUS_COLORS.optimal.base, fontSize: 10 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="hrv"
                        stroke={STATUS_COLORS.optimal.base}
                        strokeWidth={2}
                        dot={{ fill: STATUS_COLORS.optimal.base, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
