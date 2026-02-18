import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchHealthEventsToOpenClaw } from '../openclaw';
import type { HealthEvent } from '@/lib/types/health-events';

const sampleEvents: HealthEvent[] = [
  {
    id: 'event-critical',
    domain: 'biomarker',
    severity: 'critical',
    source: 'bloodwork',
    metric: 'Glucose',
    summary: 'Glucose is high at 123 mg/dL',
    value: 123,
    unit: 'mg/dL',
    occurredAt: '2026-02-10T10:00:00.000Z',
    recordedAt: '2026-02-10T10:01:00.000Z',
    confidence: 0.95,
  },
  {
    id: 'event-info',
    domain: 'activity',
    severity: 'info',
    source: 'whoop',
    metric: 'Recovery',
    summary: 'Recovery looks stable at 82%',
    value: 82,
    unit: '%',
    occurredAt: '2026-02-11T10:00:00.000Z',
    recordedAt: '2026-02-11T10:01:00.000Z',
    confidence: 0.9,
  },
];

describe('dispatchHealthEventsToOpenClaw', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENCLAW_ENABLED;
    delete process.env.OPENCLAW_HOOKS_TOKEN;
    delete process.env.OPENCLAW_HOOKS_BASE_URL;
    delete process.env.OPENCLAW_HOOKS_PATH;
    delete process.env.OPENCLAW_HOOK_MODE;
    delete process.env.OPENCLAW_EVENT_SEVERITIES;
    delete process.env.OPENCLAW_INCLUDE_SUMMARY;
  });

  it('skips dispatch when integration is disabled', async () => {
    const result = await dispatchHealthEventsToOpenClaw(sampleEvents);

    expect(result.enabled).toBe(false);
    expect(result.attempted).toBe(false);
    expect(result.delivered).toBe(false);
    expect(result.reason).toBe('disabled');
  });

  it('returns missing token when enabled without hooks token', async () => {
    process.env.OPENCLAW_ENABLED = 'true';

    const result = await dispatchHealthEventsToOpenClaw(sampleEvents);

    expect(result.enabled).toBe(true);
    expect(result.attempted).toBe(false);
    expect(result.delivered).toBe(false);
    expect(result.reason).toBe('missing_hooks_token');
  });

  it('dispatches filtered events to wake hook endpoint', async () => {
    process.env.OPENCLAW_ENABLED = 'true';
    process.env.OPENCLAW_HOOKS_TOKEN = 'test-token';
    process.env.OPENCLAW_HOOKS_BASE_URL = 'http://127.0.0.1:18789/';
    process.env.OPENCLAW_HOOKS_PATH = '/hooks';
    process.env.OPENCLAW_HOOK_MODE = 'wake';
    process.env.OPENCLAW_EVENT_SEVERITIES = 'warning,critical';

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await dispatchHealthEventsToOpenClaw(sampleEvents);

    expect(result.delivered).toBe(true);
    expect(result.forwardedCount).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [endpoint, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(endpoint).toBe('http://127.0.0.1:18789/hooks/wake');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    });

    const body = JSON.parse(String(init.body)) as { text: string };
    expect(body.text).toContain('OpenHealth alert digest');
    expect(body.text).toContain('Glucose');
  });
});
