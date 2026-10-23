import { NextRequest, NextResponse } from 'next/server';
import { HealthDataStore } from '@/lib/store/health-data';
import {
  dispatchHealthEventsToOpenClaw,
  type OpenClawDispatchResult,
} from '@/lib/integrations/openclaw';
import type { HealthEventSeverity } from '@/lib/types/health-events';
import { validateOpenClawDispatchRequest } from '@/lib/validation';
import { checkRateLimit } from '@/lib/security';
import { clientRateLimitKey, isPrivilegedRequest } from '@/lib/security/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function toSeverityList(input: HealthEventSeverity[] | undefined): HealthEventSeverity[] | undefined {
  if (!input || input.length === 0) {
    return undefined;
  }

  return input.length > 0 ? input : undefined;
}

function normalizeLimit(limit: number | undefined): number | undefined {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) {
    return undefined;
  }
  return Math.max(1, Math.min(Math.trunc(limit), 200));
}

function statusForResult(result: OpenClawDispatchResult): number {
  if (result.delivered) return 200;
  if (!result.enabled) return 200;
  if (result.reason === 'no_matching_events' || result.reason === 'dry_run') return 200;
  if (result.reason === 'missing_hooks_token' || result.reason === 'invalid_hooks_base_url') return 400;
  if (result.reason === 'http_error' || result.reason === 'network_error' || result.reason === 'timeout') {
    return 502;
  }
  return 500;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isPrivilegedRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = checkRateLimit(clientRateLimitKey(request, 'openclaw-dispatch'), 10, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  try {
    const parsed = validateOpenClawDispatchRequest(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid dispatch payload' }, { status: 400 });
    }

    const limit = normalizeLimit(parsed.data.limit);
    const severities = toSeverityList(parsed.data.severities);
    const dryRun = parsed.data.dryRun === true;

    const events = await HealthDataStore.getHealthEvents({
      limit: 200,
    });

    const result = await dispatchHealthEventsToOpenClaw(events, {
      dryRun,
      limit,
      severities,
    });

    const status = statusForResult(result);
    const success = status < 400;

    return NextResponse.json(
      {
        success,
        httpStatus: status,
        result: {
          ...result,
          error: result.error ? 'dispatch_failed' : undefined,
        },
        message: result.delivered
          ? 'OpenClaw dispatch succeeded.'
          : 'OpenClaw dispatch did not send a payload.',
      },
      { status }
    );
  } catch (error) {
    console.error('[OpenClaw Dispatch] Route error:', error);
    return NextResponse.json(
      {
        success: false,
        httpStatus: 500,
        error: 'OpenClaw dispatch failed',
      },
      { status: 500 }
    );
  }
}
