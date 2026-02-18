'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface CompositionChartProps {
    data: Array<{ name: string; value: number; color: string }>;
    totalMass: number;
}

export default function CompositionChart({ data, totalMass }: CompositionChartProps) {
    return (
        <>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, bottom: 5, left: 80 }}
                    >
                        <XAxis
                            type="number"
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 'auto']}
                            tickFormatter={(v) => `${v} lbs`}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                            width={70}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            formatter={(value) => [`${value} lbs`, '']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {totalMass > 0 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                    Total: {totalMass.toFixed(1)} lbs
                </p>
            )}
        </>
    );
}
