import { HEALTH_TOOL_NAMES, isHealthToolName, type HealthToolName } from '@/lib/agent/tool-names';

export type AgentRuntimeMode = 'live' | 'demo' | 'offline';

export type AgentStreamEvent =
  | { type: 'text'; text: string }
  | {
      type: 'tool';
      name: HealthToolName;
      status: 'start' | 'result';
      input?: unknown;
      result?: unknown;
    }
  | { type: 'mode'; mode: AgentRuntimeMode }
  | { type: 'error'; message: string };

export function encodeSseEvent(event: AgentStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function parseSseDataLine(line: string): AgentStreamEvent | null {
  const payload = line.startsWith('data: ') ? line.slice(6).trim() : line.trim();
  if (!payload) return null;

  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    if (typeof parsed.text === 'string' && parsed.type !== 'tool' && parsed.type !== 'mode' && parsed.type !== 'error') {
      return { type: 'text', text: parsed.text };
    }

    switch (parsed.type) {
      case 'text':
        return typeof parsed.text === 'string' ? { type: 'text', text: parsed.text } : null;
      case 'tool': {
        if (typeof parsed.name !== 'string' || !isHealthToolName(parsed.name)) return null;
        if (parsed.status !== 'start' && parsed.status !== 'result') return null;
        return {
          type: 'tool',
          name: parsed.name,
          status: parsed.status,
          input: parsed.input,
          result: parsed.result,
        };
      }
      case 'mode':
        if (parsed.mode === 'live' || parsed.mode === 'demo' || parsed.mode === 'offline') {
          return { type: 'mode', mode: parsed.mode };
        }
        return null;
      case 'error':
        return typeof parsed.message === 'string' ? { type: 'error', message: parsed.message } : null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export const TOOL_CATALOG = HEALTH_TOOL_NAMES.map((name) => {
  switch (name) {
    case 'lookupBiomarker':
      return {
        name,
        label: 'Biomarker lookup',
        description: 'Find a lab marker, status vs optimal range, and empty-state when unsynced.',
      };
    case 'getRecoverySnapshot':
      return {
        name,
        label: 'Recovery snapshot',
        description: '7-day HRV, sleep, resting heart rate, recovery, and steps.',
      };
    case 'getHealthScorecard':
      return {
        name,
        label: 'Health scorecard',
        description: 'PhenoAge delta plus composite biomarker/activity score.',
      };
    default:
      return assertToolCatalog(name);
  }
});

function assertToolCatalog(name: never): never {
  throw new Error(`Unhandled tool catalog entry: ${String(name)}`);
}
