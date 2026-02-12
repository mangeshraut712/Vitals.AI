'use client';

import {
    PieChart,
    Pie,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface FatDistributionChartProps {
    data: Array<{ name: string; value: number; color: string }>;
}

export default function FatDistributionChart({ data }: FatDistributionChartProps) {
    return (
        <>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                            labelLine={false}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            formatter={(value) => [`${value} lbs`, '']}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
                {data.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-muted-foreground">{entry.name} Mass</span>
                    </div>
                ))}
            </div>
        </>
    );
}
