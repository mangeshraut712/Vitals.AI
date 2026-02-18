import type { HealthEvent, HealthEventSeverity } from '@/lib/types/health-events';

export type OpenClawHookMode = 'wake' | 'agent';
type OpenClawWakeMode = 'now' | 'next-heartbeat';

type OpenClawDispatchReason =
  | 'disabled'
  | 'missing_hooks_token'
  | 'no_matching_events'
  | 'dry_run'
  | 'timeout'
  | 'network_error'
  | 'http_error';

export interface OpenClawEventDigest {
  id: string;
  domain: HealthEvent['domain'];
  severity: HealthEvent['severity'];
  source: HealthEvent['source'];
  metric: string;
  occurredAt: string;
  status?: string;
  summary?: string;
}

export interface OpenClawDispatchOptions {
  dryRun?: boolean;
  limit?: number;
  severities?: HealthEventSeverity[];
}

export interface OpenClawDispatchResult {
  enabled: boolean;
  attempted: boolean;
  delivered: boolean;
  reason?: OpenClawDispatchReason;
  error?: string;
  mode?: OpenClawHookMode;
  endpoint?: string;
  statusCode?: number;
  totalCount: number;
  matchedCount: number;
  forwardedCount: number;
  digest: OpenClawEventDigest[];
}

interface OpenClawConfig {
  enabled: boolean;
  hooksToken?: string;
  hooksBaseUrl: string;
  hooksPath: string;
  mode: OpenClawHookMode;
  wakeMode: OpenClawWakeMode;
  severities: HealthEventSeverity[];
  maxEvents: number;
  includeSummary: boolean;
  timeoutMs: number;
  hookName?: string;
  agentId?: string;
  deliver: boolean;
  channel?: string;
  to?: string;
}

interface OpenClawConfigIssue {
  reason?: OpenClawDispatchReason;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return fallback;
}

function parseNumber(value: string | undefined, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function parseSeverityList(input: string | undefined): HealthEventSeverity[] {
  if (!input) return ['warning', 'critical'];

  const parsed = input
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is HealthEventSeverity => (
      item === 'info' || item === 'warning' || item === 'critical'
    ));

  return parsed.length > 0 ? parsed : ['warning', 'critical'];
}

function parseHookMode(input: string | undefined): OpenClawHookMode {
  return input === 'agent' ? 'agent' : 'wake';
}

function parseWakeMode(input: string | undefined): OpenClawWakeMode {
  return input === 'next-heartbeat' ? 'next-heartbeat' : 'now';
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function trimLeadingSlash(value: string): string {
  return value.startsWith('/') ? value.slice(1) : value;
}

function buildEndpoint(config: OpenClawConfig): string {
  const base = trimTrailingSlash(config.hooksBaseUrl);
  const path = trimLeadingSlash(config.hooksPath);
  return `${base}/${path}/${config.mode}`;
}

function sanitizeSummary(summary: string): string {
  return summary.replace(/\b\d+(?:\.\d+)?\b/g, '[redacted]');
}

function toDigest(event: HealthEvent, includeSummary: boolean): OpenClawEventDigest {
  return {
    id: event.id,
    domain: event.domain,
    severity: event.severity,
    source: event.source,
    metric: event.metric,
    occurredAt: event.occurredAt,
    status: event.status,
    summary: includeSummary ? sanitizeSummary(event.summary) : undefined,
  };
}

function buildWakeText(digest: OpenClawEventDigest[]): string {
  const critical = digest.filter((event) => event.severity === 'critical').length;
  const warning = digest.filter((event) => event.severity === 'warning').length;
  const info = digest.filter((event) => event.severity === 'info').length;

  const metricPreview = digest
    .slice(0, 5)
    .map((event) => `${event.metric} (${event.domain})`)
    .join(', ');

  return [
    `OpenHealth alert digest: ${critical} critical, ${warning} warning, ${info} info events.`,
    metricPreview ? `Top signals: ${metricPreview}.` : undefined,
  ]
    .filter(Boolean)
    .join(' ');
}

function buildAgentMessage(digest: OpenClawEventDigest[]): string {
  const payload = {
    source: 'openhealth',
    generatedAt: new Date().toISOString(),
    events: digest,
  };

  return [
    'OpenHealth event digest for triage.',
    'Return: 1) priority level, 2) likely contributors, 3) immediate next actions.',
    `Digest JSON:\n${JSON.stringify(payload, null, 2)}`,
  ].join('\n\n');
}

function loadConfig(): OpenClawConfig {
  return {
    enabled: parseBoolean(process.env.OPENCLAW_ENABLED, false),
    hooksToken: process.env.OPENCLAW_HOOKS_TOKEN?.trim(),
    hooksBaseUrl: process.env.OPENCLAW_HOOKS_BASE_URL?.trim() || 'http://127.0.0.1:18789',
    hooksPath: process.env.OPENCLAW_HOOKS_PATH?.trim() || '/hooks',
    mode: parseHookMode(process.env.OPENCLAW_HOOK_MODE),
    wakeMode: parseWakeMode(process.env.OPENCLAW_HOOK_WAKE_MODE),
    severities: parseSeverityList(process.env.OPENCLAW_EVENT_SEVERITIES),
    maxEvents: parseNumber(process.env.OPENCLAW_MAX_EVENTS, 12, 1, 200),
    includeSummary: parseBoolean(process.env.OPENCLAW_INCLUDE_SUMMARY, false),
    timeoutMs: parseNumber(process.env.OPENCLAW_TIMEOUT_MS, 8000, 1000, 60000),
    hookName: process.env.OPENCLAW_HOOK_NAME?.trim() || 'OpenHealth',
    agentId: process.env.OPENCLAW_AGENT_ID?.trim(),
    deliver: parseBoolean(process.env.OPENCLAW_AGENT_DELIVER, false),
    channel: process.env.OPENCLAW_AGENT_CHANNEL?.trim(),
    to: process.env.OPENCLAW_AGENT_TO?.trim(),
  };
}

function validateConfig(config: OpenClawConfig): OpenClawConfigIssue {
  if (!config.enabled) {
    return { reason: 'disabled' };
  }
  if (!config.hooksToken) {
    return { reason: 'missing_hooks_token' };
  }
  return {};
}

function buildHookPayload(config: OpenClawConfig, digest: OpenClawEventDigest[]): Record<string, unknown> {
  if (config.mode === 'wake') {
    return {
      text: buildWakeText(digest),
      mode: config.wakeMode,
    };
  }

  const payload: Record<string, unknown> = {
    message: buildAgentMessage(digest),
    name: config.hookName,
    wakeMode: config.wakeMode,
    deliver: config.deliver,
  };

  if (config.agentId) {
    payload.agentId = config.agentId;
  }
  if (config.channel) {
    payload.channel = config.channel;
  }
  if (config.to) {
    payload.to = config.to;
  }

  return payload;
}

export async function dispatchHealthEventsToOpenClaw(
  events: HealthEvent[],
  options: OpenClawDispatchOptions = {}
): Promise<OpenClawDispatchResult> {
  const config = loadConfig();
  const validation = validateConfig(config);
  const totalCount = events.length;
  const limit = Math.max(1, Math.min(options.limit ?? config.maxEvents, 200));
  const severitySet = new Set<HealthEventSeverity>(
    options.severities && options.severities.length > 0 ? options.severities : config.severities
  );
  const matchedEvents = events.filter((event) => severitySet.has(event.severity));
  const selectedEvents = matchedEvents.slice(0, limit);
  const digest = selectedEvents.map((event) => toDigest(event, config.includeSummary));

  if (validation.reason) {
    return {
      enabled: config.enabled,
      attempted: false,
      delivered: false,
      reason: validation.reason,
      mode: config.mode,
      totalCount,
      matchedCount: matchedEvents.length,
      forwardedCount: digest.length,
      digest,
    };
  }

  if (digest.length === 0) {
    return {
      enabled: config.enabled,
      attempted: false,
      delivered: false,
      reason: 'no_matching_events',
      mode: config.mode,
      totalCount,
      matchedCount: matchedEvents.length,
      forwardedCount: 0,
      digest: [],
    };
  }

  const endpoint = buildEndpoint(config);

  if (options.dryRun) {
    return {
      enabled: config.enabled,
      attempted: false,
      delivered: false,
      reason: 'dry_run',
      mode: config.mode,
      endpoint,
      totalCount,
      matchedCount: matchedEvents.length,
      forwardedCount: digest.length,
      digest,
    };
  }

  const payload = buildHookPayload(config, digest);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.hooksToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return {
        enabled: config.enabled,
        attempted: true,
        delivered: false,
        reason: 'http_error',
        error: body ? body.slice(0, 240) : `OpenClaw returned ${response.status}`,
        mode: config.mode,
        endpoint,
        statusCode: response.status,
        totalCount,
        matchedCount: matchedEvents.length,
        forwardedCount: digest.length,
        digest,
      };
    }

    return {
      enabled: config.enabled,
      attempted: true,
      delivered: true,
      mode: config.mode,
      endpoint,
      statusCode: response.status,
      totalCount,
      matchedCount: matchedEvents.length,
      forwardedCount: digest.length,
      digest,
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return {
      enabled: config.enabled,
      attempted: true,
      delivered: false,
      reason: isTimeout ? 'timeout' : 'network_error',
      error: error instanceof Error ? error.message : 'Failed to reach OpenClaw',
      mode: config.mode,
      endpoint,
      totalCount,
      matchedCount: matchedEvents.length,
      forwardedCount: digest.length,
      digest,
    };
  } finally {
    clearTimeout(timeout);
  }
}
