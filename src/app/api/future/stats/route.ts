import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

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

export async function GET() {
    let stats = {
        healthScore: 92, // Default/Mock
        prevHealthScore: 88,
        hrvStatus: 'peak',
        glucose: {
            current: 98,
            trend: 'stable',
            history: [95, 96, 99, 98, 97, 98, 98]
        },
        coaching: {
            message: "Based on your Oura Sleep Score (85) and Morning HRV (62ms), you've fully recovered from yesterday's strain. Suggested workout: Zone 2 Endurance Run (45 mins).",
            metrics: {
                sleep: 85,
                hrv: 62
            }
        },
        community: {
            rank: 'top 5%',
            metric: 'recovery'
        },
        devices: [
            { name: 'Apple Watch Ultra', type: 'wearable', status: 'connected' },
            { name: 'Oura Ring Gen 4', type: 'wearable', status: 'syncing' },
            { name: 'Withings Body Comp', type: 'scale', status: 'disconnected' },
            { name: 'Ultrahuman M1', type: 'glucose_monitor', status: 'connected' },
        ]
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
        console.warn("FutureStats API: DB fetch failed, serving fallback data.", e);
    }

    return NextResponse.json(stats);
}
