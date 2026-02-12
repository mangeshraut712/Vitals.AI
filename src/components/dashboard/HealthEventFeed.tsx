import type { HealthEvent } from '@/lib/types/health-events';

interface HealthEventFeedProps {
  events: HealthEvent[];
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

export function HealthEventFeed({ events }: HealthEventFeedProps): React.JSX.Element {
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
        <span className="text-xs text-muted-foreground font-medium">{events.length} events</span>
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

