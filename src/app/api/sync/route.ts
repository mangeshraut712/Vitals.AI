import { NextResponse } from 'next/server';
import { clearAllCache } from '@/lib/cache';
import { HealthDataStore } from '@/lib/store/health-data';
import { dispatchHealthEventsToOpenClaw } from '@/lib/integrations/openclaw';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Reset the singleton so it reloads on next request
const globalForHealthData = globalThis as unknown as {
  healthDataStore: unknown;
};

function isTrue(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

export async function POST(): Promise<NextResponse> {
  try {
    console.log('[Sync] Starting data sync...');

    // Clear the cache to force re-extraction
    clearAllCache();

    // Reset the singleton loaded flag so data reloads on next request
    if (globalForHealthData.healthDataStore) {
      (globalForHealthData.healthDataStore as { loaded: boolean }).loaded = false;
    }

    let openclawDispatch:
      | {
        attempted: boolean;
        delivered: boolean;
        reason?: string;
        forwardedCount?: number;
      }
      | undefined;

    if (isTrue(process.env.OPENCLAW_AUTO_DISPATCH_ON_SYNC)) {
      try {
        const events = await HealthDataStore.getHealthEvents({ limit: 200 });
        const result = await dispatchHealthEventsToOpenClaw(events);
        openclawDispatch = {
          attempted: result.attempted,
          delivered: result.delivered,
          reason: result.reason,
          forwardedCount: result.forwardedCount,
        };
      } catch (error) {
        console.error('[Sync] OpenClaw auto-dispatch failed:', error);
        openclawDispatch = {
          attempted: true,
          delivered: false,
          reason: 'dispatch_error',
        };
      }
    }

    console.log('[Sync] Cache cleared, data will be re-extracted on next page load');

    return NextResponse.json({
      success: true,
      message: 'Cache cleared. Data will be re-extracted on next page load.',
      openclawDispatch,
    });
  } catch (error) {
    console.error('[Sync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
  }
}
