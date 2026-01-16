'use client';

import {
  BACKGROUNDS,
  BORDERS,
  SHADOWS,
  TEXT_COLORS,
  RADIUS,
} from '@/lib/design/tokens';

export interface WeeklySummary {
  sleepConsistency: number | null; // percentage
  sleepHours: number | null; // average hours per night
  hrv: number | null; // ms
  strain: number | null; // 0-21 scale
  recovery: number | null; // percentage
  steps: number | null; // daily average
}

interface WeeklyLifestyleCardProps {
  summary: WeeklySummary | null;
}

interface MetricDisplay {
  label: string;
  value: string;
  subtext: string;
  icon: React.JSX.Element;
}

/**
 * WeeklyLifestyleCard - Shows weekly lifestyle metrics
 *
 * Displays 4 key metrics:
 * - Sleep Consistency
 * - HRV (Heart Rate Variability)
 * - Strain
 * - Recovery
 *
 * Shows skeleton/placeholder when no Whoop data connected.
 */
export function WeeklyLifestyleCard({
  summary,
}: WeeklyLifestyleCardProps): React.JSX.Element {
  const hasData = summary !== null;

  const metrics: MetricDisplay[] = [
    {
      label: 'Sleep',
      value: summary !== null && summary.sleepConsistency !== null
        ? `${summary.sleepConsistency}%`
        : '--',
      subtext: 'consistency',
      icon: <SleepIcon />,
    },
    {
      label: 'HRV',
      value: summary !== null && summary.hrv !== null
        ? `${summary.hrv}`
        : '--',
      subtext: 'ms avg',
      icon: <HrvIcon />,
    },
    {
      label: 'Strain',
      value: summary !== null && summary.strain !== null
        ? summary.strain.toFixed(1)
        : '--',
      subtext: 'weekly avg',
      icon: <StrainIcon />,
    },
    {
      label: 'Recovery',
      value: summary !== null && summary.recovery !== null
        ? `${summary.recovery}%`
        : '--',
      subtext: 'avg score',
      icon: <RecoveryIcon />,
    },
  ];

  return (
    <div
      className="h-full"
      style={{
        background: BACKGROUNDS.card,
        borderRadius: RADIUS.lg,
        boxShadow: SHADOWS.sm,
        border: `1px solid ${BORDERS.light}`,
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4"
        style={{ borderBottom: `1px solid ${BORDERS.light}` }}
      >
        <h3
          className="font-semibold text-sm"
          style={{ color: TEXT_COLORS.primary }}
        >
          This Week
        </h3>
        <p className="text-xs mt-0.5" style={{ color: TEXT_COLORS.muted }}>
          7-day averages
        </p>
      </div>

      {/* Metrics grid */}
      <div className="px-5 py-4">
        {!hasData ? (
          // Empty state
          <div className="py-4 text-center">
            <div
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ background: BACKGROUNDS.accent }}
            >
              <WatchIcon />
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: TEXT_COLORS.secondary }}
            >
              No activity data
            </p>
            <p className="text-xs mt-1" style={{ color: TEXT_COLORS.muted }}>
              Connect Whoop to see your metrics
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <div
                  className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center"
                  style={{ background: BACKGROUNDS.accent }}
                >
                  {metric.icon}
                </div>
                <div
                  className="text-xl font-bold tabular-nums"
                  style={{ color: TEXT_COLORS.primary }}
                >
                  {metric.value}
                </div>
                <div
                  className="text-xs font-medium"
                  style={{ color: TEXT_COLORS.secondary }}
                >
                  {metric.label}
                </div>
                <div className="text-[10px]" style={{ color: TEXT_COLORS.muted }}>
                  {metric.subtext}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Icons
function SleepIcon(): React.JSX.Element {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={TEXT_COLORS.secondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function HrvIcon(): React.JSX.Element {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={TEXT_COLORS.secondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function StrainIcon(): React.JSX.Element {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={TEXT_COLORS.secondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function RecoveryIcon(): React.JSX.Element {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={TEXT_COLORS.secondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function WatchIcon(): React.JSX.Element {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={TEXT_COLORS.muted}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="7" />
      <polyline points="12 9 12 12 13.5 13.5" />
      <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83" />
    </svg>
  );
}

export default WeeklyLifestyleCard;
