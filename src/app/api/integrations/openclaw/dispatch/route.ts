import { NextRequest, NextResponse } from 'next/server';
import { HealthDataStore } from '@/lib/store/health-data';
import {
  dispatchHealthEventsToOpenClaw,
  type OpenClawDispatchResult,
} from '@/lib/integrations/openclaw';
import type { HealthEventSeverity } from '@/lib/types/health-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface DispatchRequestBody {
  limit?: number;
  dryRun?: boolean;
  severities?: string[];
}

function toSeverityList(input: string[] | undefined): HealthEventSeverity[] | undefined {
  if (!input || input.length === 0) {
    return undefined;
  }

  const normalized = input
    .map((value) => value.trim().toLowerCase())
    .filter(
      (value): value is HealthEventSeverity =>
        value === 'info' || value === 'warning' || value === 'critical'
    );

  return normalized.length > 0 ? normalized : undefined;
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
  if (result.reason === 'missing_hooks_token') return 400;
  if (result.reason === 'http_error' || result.reason === 'network_error' || result.reason === 'timeout') {
    return 502;
  }
  return 500;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as DispatchRequestBody;
    const limit = normalizeLimit(body.limit);
    const severities = toSeverityList(body.severities);
    const dryRun = body.dryRun === true;

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
        result,
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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
