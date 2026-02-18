'use client';

import { useMemo, useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { HealthEvent } from '@/lib/types/health-events';
import type { OpenClawDispatchResult } from '@/lib/integrations/openclaw';

interface HealthEventFeedProps {
  events: HealthEvent[];
}

interface OpenClawDispatchApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  result?: OpenClawDispatchResult;
}

function getSeverityClasses(severity: HealthEvent['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-rose-500';
    case 'warning':
      return 'bg-amber-500';
    case 'info':
      return 'bg-emerald-500';
  }
}

function formatEventTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function describeOpenClawResult(result: OpenClawDispatchResult): string {
  if (result.delivered) {
    return `Forwarded ${result.forwardedCount} events using ${result.mode} hook.`;
  }

  switch (result.reason) {
    case 'disabled':
      return 'OpenClaw is disabled. Set OPENCLAW_ENABLED=true to enable dispatch.';
    case 'missing_hooks_token':
      return 'Missing OPENCLAW_HOOKS_TOKEN in environment configuration.';
    case 'invalid_hooks_base_url':
      return 'OPENCLAW_HOOKS_BASE_URL must be a public URL in hosted deployments.';
    case 'no_matching_events':
      return 'No events matched the configured severity filter.';
    case 'dry_run':
      return `Dry run complete. ${result.forwardedCount} events are ready to send.`;
    case 'timeout':
      return 'OpenClaw request timed out.';
    case 'network_error':
      return result.error ?? 'Network error while contacting OpenClaw.';
    case 'http_error':
      return result.error ?? `OpenClaw returned HTTP ${result.statusCode ?? 'error'}.`;
    default:
      return 'OpenClaw dispatch completed with no delivery.';
  }
}

export function HealthEventFeed({ events }: HealthEventFeedProps): React.JSX.Element {
  const [isSending, setIsSending] = useState(false);
  const actionableCount = useMemo(
    () => events.filter((event) => event.severity !== 'info').length,
    [events]
  );

  const handleDispatchToOpenClaw = async (): Promise<void> => {
    setIsSending(true);
    try {
      const response = await fetch('/api/integrations/openclaw/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          severities: ['warning', 'critical'],
          limit: 20,
        }),
      });

      const data = (await response.json()) as OpenClawDispatchApiResponse;
      const result = data.result;

      if (result) {
        const description = describeOpenClawResult(result);
        if (result.delivered) {
          toast.success('OpenClaw notified', { description });
        } else if (result.reason === 'disabled' || result.reason === 'no_matching_events') {
          toast('OpenClaw dispatch skipped', { description });
        } else {
          toast.error('OpenClaw dispatch failed', { description });
        }
      } else if (!data.success) {
        toast.error('OpenClaw dispatch failed', {
          description: data.error ?? 'Unknown error',
        });
      } else {
        toast('OpenClaw dispatch complete', {
          description: data.message ?? 'No additional details.',
        });
      }
    } catch (error) {
      toast.error('OpenClaw dispatch failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="vitals-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Health Event Feed
          </h2>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Normalized events from biomarkers, activity, and body composition.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium">{events.length} events</span>
          <button
            type="button"
            onClick={handleDispatchToOpenClaw}
            disabled={isSending || actionableCount === 0}
            className="group inline-flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? (
              <Bot className="h-3.5 w-3.5 animate-pulse" />
            ) : (
              <Send className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            )}
            <span>{isSending ? 'Sending...' : 'Send to OpenClaw'}</span>
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events yet. Sync data to populate the feed.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
            >
              <span className={`mt-1.5 w-2 h-2 rounded-full ${getSeverityClasses(event.severity)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed">{event.summary}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="uppercase tracking-wide">{event.domain}</span>
                  <span>•</span>
                  <span>{event.source}</span>
                  <span>•</span>
                  <span>{formatEventTime(event.occurredAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HealthEventFeed;
