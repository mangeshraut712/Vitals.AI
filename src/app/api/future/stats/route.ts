import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateTrend, type DataPoint } from '@/lib/analysis/advanced-analytics';
import { loggers } from '@/lib/logger';
import { DEMO_FUTURE_STATS } from '@/lib/future/demo-stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FutureStatsActivity {
    hrv?: number | null;
    sleepScore?: number | null;
    source?: string | null;
}

interface FutureStatsDevice {
    name: string;
    type: string;
    status: string;
    lastSync?: string | Date | null;
}

interface FutureStatsUser {
    devices: FutureStatsDevice[];
    activities: FutureStatsActivity[];
}

type FutureDashboardStats = Omit<typeof DEMO_FUTURE_STATS, 'devices'> & {
    devices: FutureStatsDevice[];
};

export async function GET() {
    let stats: FutureDashboardStats = {
        ...DEMO_FUTURE_STATS,
        devices: DEMO_FUTURE_STATS.devices.map((device) => ({
            name: device.name,
            type: device.type,
            status: device.status,
        })),
    };

    try {
        // 1. Fetch Demo User
        const user = await prisma.user.findUnique({
            where: { email: 'demo@vitals.ai' },
            include: {
                devices: true,
                activities: {
                    orderBy: { date: 'desc' },
                    take: 1
                }
            }
        }) as FutureStatsUser | null;

        if (user) {
            // 2. Hydrate user data from DB
            const latestActivity = user.activities[0];
            const devices = user.devices.map(d => ({
                name: d.name,
                type: d.type,
                status: d.status,
                lastSync: d.lastSync,
            }));

            if (latestActivity) {
                // Calculate dynamic health score based on seeded activity
                const hrv = latestActivity.hrv || 60;
                const sleep = latestActivity.sleepScore || 80;
                const dynamicScore = Math.round((hrv + sleep) / 2);

                stats = {
                    ...stats,
                    healthScore: dynamicScore,
                    prevHealthScore: dynamicScore - 2, // Mock trend
                    hrvStatus: hrv > 60 ? 'peak' : 'recovery',
                    coaching: {
                        message: `Based on your latest ${latestActivity.source} sync (Sleep Score ${sleep}, HRV ${hrv}ms), you are ready to train.`,
                        metrics: {
                            sleep: sleep,
                            hrv: hrv
                        }
                    },
                    devices: devices.length > 0 ? devices : stats.devices
                };
            }
        }
    } catch (e) {
        loggers.api.warn('FutureStats API DB fetch failed, serving fallback data', e);
    }

    const glucosePoints: DataPoint[] = stats.glucose.history.map((value, index) => ({
        timestamp: new Date(Date.now() - (stats.glucose.history.length - 1 - index) * 24 * 60 * 60 * 1000),
        value,
    }));
    const glucoseTrend = calculateTrend(glucosePoints);
    stats.glucose.trend = glucoseTrend.direction === 'stable' ? 'stable' : 'variable';

    return NextResponse.json(stats);
}
