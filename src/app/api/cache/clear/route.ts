import { NextResponse } from 'next/server';
import { clearAllCache } from '@/lib/cache';

/**
 * POST /api/cache/clear
 * Clears all cached extraction data, forcing re-extraction on next load
 */
export async function POST(): Promise<NextResponse> {
  try {
    clearAllCache();
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully. Data will be re-extracted on next load.',
    });
  } catch (error) {
    console.error('[API] Error clearing cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' }
    );
  }
}
