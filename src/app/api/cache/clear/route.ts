import { NextRequest, NextResponse } from 'next/server';
import { clearAllCache } from '@/lib/cache';
import { checkRateLimit } from '@/lib/security';
import { clientRateLimitKey, isPrivilegedRequest } from '@/lib/security/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/cache/clear
 * Clears all cached extraction data, forcing re-extraction on next load
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isPrivilegedRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = checkRateLimit(clientRateLimitKey(request, 'cache-clear'), 10, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  try {
    clearAllCache();
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully. Data will be re-extracted on next load.',
    });
  } catch (error) {
    console.error('[API] Error clearing cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
