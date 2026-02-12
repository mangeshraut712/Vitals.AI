'use client';

import { formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';
import type { DataSourceTimestamps } from '@/lib/store/health-data';
import { Droplets, Activity, ScanLine } from 'lucide-react';

interface DataFreshnessBarProps {
  timestamps: DataSourceTimestamps;
}

interface DataSourceInfo {
  label: string;
  timestamp: string | null;
  icon: React.JSX.Element;
}

/**
 * Get freshness status based on days since last update
 */
function getFreshnessStatus(
  timestamp: string | null
): 'fresh' | 'stale' | 'very_stale' | 'none' {
  if (!timestamp) return 'none';

  const daysAgo = differenceInDays(new Date(), parseISO(timestamp));

  if (daysAgo <= 7) return 'fresh';
  if (daysAgo <= 30) return 'stale';
  return 'very_stale';
}

/**
 * Get text color for freshness status
 */
function getFreshnessClasses(status: 'fresh' | 'stale' | 'very_stale' | 'none'): string {
  switch (status) {
    case 'fresh':
      return 'text-emerald-500';
    case 'stale':
      return 'text-amber-500';
    case 'very_stale':
      return 'text-rose-500';
    case 'none':
      return 'text-muted-foreground';
  }
}

/**
 * Format relative time from timestamp
 */
function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return 'No data';

  try {
    return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

/**
 * DataFreshnessBar - Shows data source freshness
 */
export function DataFreshnessBar({
  timestamps,
}: DataFreshnessBarProps): React.JSX.Element {
  const sources: DataSourceInfo[] = [
    {
      label: 'Blood work',
      timestamp: timestamps.bloodwork,
      icon: <Droplets className="w-3.5 h-3.5" />,
    },
    {
      label: 'Activity',
      timestamp: timestamps.activity,
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      label: 'DEXA',
      timestamp: timestamps.dexa,
      icon: <ScanLine className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-xs border-b border-border">
      {sources.map((source, index) => {
        const status = getFreshnessStatus(source.timestamp);
        const colorClass = getFreshnessClasses(status);
        const relativeTime = formatRelativeTime(source.timestamp);

        return (
          <div key={source.label} className="flex items-center gap-1.5">
            {index > 0 && (
              <span className="hidden sm:inline mr-4 text-border">
                |
              </span>
            )}
            <span className="text-muted-foreground">{source.icon}</span>
            <span className="text-muted-foreground">{source.label}:</span>
            <span className={`font-medium ${colorClass}`}>
              {relativeTime}
            </span>
            {status === 'very_stale' && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-500">
                Retest
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default DataFreshnessBar;
