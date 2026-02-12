'use client';

import { useState } from 'react';

export type InsightStatus = 'optimal' | 'warning' | 'critical';

export interface InsightCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: InsightStatus;
  subtitle?: string;
  actionItems: string[];
}

const STATUS_LABELS: Record<InsightStatus, string> = {
  optimal: 'Optimal',
  warning: 'Needs Attention',
  critical: 'Critical',
};

export function InsightCard({
  title,
  value,
  unit,
  status,
  subtitle,
  actionItems,
}: InsightCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    optimal: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    warning: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    critical: { text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  };

  const colors = statusColors[status];
  const statusLabel = STATUS_LABELS[status];

  return (
    <div className={`relative overflow-hidden transition-all duration-300 bg-card border border-border rounded-xl hover:shadow-md group ${expanded ? 'ring-1 ring-primary/20' : ''}`}>

      {/* Main content */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left focus:outline-none"
        aria-expanded={expanded}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${colors.bg} ${colors.text}`}>
            {statusLabel}
          </span>
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className={`text-3xl font-bold ${colors.text} tabular-nums`}>{value}</span>
          {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
        </div>

        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}

        {/* Expand toggle */}
        <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          <span>{expanded ? 'Hide recommendations' : 'View recommendations'}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable action items */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        {/* Separator */}
        <div className="h-px bg-border mx-5" />

        <div className="p-5 pt-4 bg-muted/30">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
            Tips to Improve
          </h4>
          <ul className="space-y-2.5">
            {actionItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.bg.replace('/10', '')}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
