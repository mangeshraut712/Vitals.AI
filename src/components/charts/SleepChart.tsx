'use client';

import {
    BarChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { STATUS_COLORS } from '@/lib/design/tokens';

interface SleepChartProps {
    data: Array<{
        dateLabel: string;
        sleepHours: number;
        sleepScore?: number;
    }>;
}

export default function SleepChart({ data }: SleepChartProps) {
    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 10]}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: 'var(--muted-foreground)', fontSize: 10 }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        label={{ value: 'Score', angle: 90, position: 'insideRight', fill: 'var(--muted-foreground)', fontSize: 10 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                        formatter={(value, name) => {
                            if (name === 'sleepHours') return [`${value ?? 0} hrs`, 'Sleep'];
                            return [`${value ?? 0}%`, 'Score'];
                        }}
                    />
                    <Bar
                        yAxisId="left"
                        dataKey="sleepHours"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        name="sleepHours"
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="sleepScore"
                        stroke={STATUS_COLORS.optimal.base}
                        strokeWidth={2}
                        dot={{ fill: STATUS_COLORS.optimal.base, strokeWidth: 2, r: 3 }}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
