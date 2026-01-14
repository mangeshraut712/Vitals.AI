'use client';

import { useState } from 'react';
import { RADIUS, SHADOWS } from '@/lib/design/tokens';

export type InsightStatus = 'optimal' | 'warning' | 'critical';

export interface InsightCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: InsightStatus;
  subtitle?: string;
  actionItems: string[];
}

const INSIGHT_GRADIENTS: Record<InsightStatus, string> = {
  optimal: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  warning: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  critical: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
};

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
  const gradient = INSIGHT_GRADIENTS[status];
  const statusLabel = STATUS_LABELS[status];

  return (
    <div
      className="text-white relative overflow-hidden transition-all duration-300"
      style={{
        background: gradient,
        borderRadius: RADIUS.xl,
        boxShadow: SHADOWS.md,
      }}
    >
      {/* Main content - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-inset"
        aria-expanded={expanded}
        aria-controls={`insight-${title.replace(/\s+/g, '-').toLowerCase()}-content`}
      >
        {/* Status badge */}
        <span className="absolute top-4 right-4 text-xs bg-white/20 px-2.5 py-1 rounded-full">
          {statusLabel}
        </span>

        {/* Value display */}
        <div className="pr-20">
          <span className="text-xs text-white/70 uppercase tracking-wide font-medium">
            {title}
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold">{value}</span>
            {unit && <span className="text-lg text-white/80">{unit}</span>}
          </div>
          {subtitle && (
            <p className="text-sm text-white/70 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Expand indicator */}
        <div className="flex items-center gap-1 mt-3 text-sm text-white/80">
          <span>{expanded ? 'Hide tips' : 'View tips'}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
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
        id={`insight-${title.replace(/\s+/g, '-').toLowerCase()}-content`}
        className={`overflow-hidden transition-all duration-300 ease-out ${
          expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5 pt-0 border-t border-white/20">
          <h4 className="text-sm font-medium mb-3 pt-4">Recommendations</h4>
          <ul className="space-y-2">
            {actionItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-white/90">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
