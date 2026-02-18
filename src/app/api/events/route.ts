import { NextRequest, NextResponse } from 'next/server';
import { HealthDataStore } from '@/lib/store/health-data';
import { loggers } from '@/lib/logger';
import { validateNumber } from '@/lib/security';
import type {
  HealthEventDomain,
  HealthEventQuery,
  HealthEventSeverity,
} from '@/lib/types/health-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_DOMAINS: HealthEventDomain[] = [
  'biomarker',
  'activity',
  'body_comp',
  'longevity',
  'system',
];

const VALID_SEVERITIES: HealthEventSeverity[] = ['info', 'warning', 'critical'];

function isHealthEventDomain(value: string): value is HealthEventDomain {
  return VALID_DOMAINS.includes(value as HealthEventDomain);
}

function isHealthEventSeverity(value: string): value is HealthEventSeverity {
  return VALID_SEVERITIES.includes(value as HealthEventSeverity);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const params = request.nextUrl.searchParams;
    const rawLimit = params.get('limit');
    const parsedLimit = validateNumber(rawLimit ?? 50, 1, 200) ?? 50;

    const domains = params.getAll('domain').filter(isHealthEventDomain);
    const severities = params.getAll('severity').filter(isHealthEventSeverity);

    const query: HealthEventQuery = {
      limit: parsedLimit,
      domains: domains.length > 0 ? domains : undefined,
      severities: severities.length > 0 ? severities : undefined,
    };

    const events = await HealthDataStore.getHealthEvents(query);

    return NextResponse.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    loggers.api.error('Events API error loading health events', error);
    return NextResponse.json(
      {
        success: true,
        count: 0,
        events: [],
        degraded: true,
        warning: 'events-unavailable',
      }
    );
  }
}
