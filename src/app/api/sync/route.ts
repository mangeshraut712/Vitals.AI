import { NextResponse } from 'next/server';
import { clearAllCache } from '@/lib/cache';

// Reset the singleton so it reloads on next request
const globalForHealthData = globalThis as unknown as {
  healthDataStore: unknown;
};

export async function POST(): Promise<NextResponse> {
  try {
    console.log('[Sync] Starting data sync...');

    // Clear the cache to force re-extraction
    clearAllCache();

    // Reset the singleton loaded flag so data reloads on next request
    if (globalForHealthData.healthDataStore) {
      (globalForHealthData.healthDataStore as { loaded: boolean }).loaded = false;
    }

    console.log('[Sync] Cache cleared, data will be re-extracted on next page load');

    return NextResponse.json({
      success: true,
      message: 'Cache cleared. Data will be re-extracted on next page load.',
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
