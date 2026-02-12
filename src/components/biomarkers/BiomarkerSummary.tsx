'use client';

import { useMemo } from 'react';
import { HealthDataStore } from '@/lib/store/health-data';
import { getBiomarkerStatus, BIOMARKER_REFERENCES, BiomarkerStatus } from '@/lib/types/health';
import { STATUS_COLORS, CARD_CLASSES } from '@/lib/design/tokens';

interface BiomarkerCount {
  total: number;
  optimal: number;
  normal: number;
  outOfRange: number;
}

function categorizeStatus(status: BiomarkerStatus): 'optimal' | 'normal' | 'outOfRange' {
  if (status === 'optimal') return 'optimal';
  if (status === 'normal' || status === 'borderline') return 'normal';
  return 'outOfRange';
}

export function BiomarkerSummary(): React.JSX.Element {
  const counts = useMemo((): BiomarkerCount => {
    const biomarkers = HealthDataStore.getBiomarkers();
    const result: BiomarkerCount = { total: 0, optimal: 0, normal: 0, outOfRange: 0 };

    for (const [key, value] of Object.entries(biomarkers)) {
      if (key === 'patientAge' || value === undefined) continue;
      if (!BIOMARKER_REFERENCES[key]) continue;

      result.total++;
      const status = getBiomarkerStatus(key, value);
      const category = categorizeStatus(status);
      result[category]++;
    }

    return result;
  }, []);

  const percentages = useMemo(() => {
    if (counts.total === 0) return { optimal: 0, normal: 0, outOfRange: 0 };
    return {
      optimal: (counts.optimal / counts.total) * 100,
      normal: (counts.normal / counts.total) * 100,
      outOfRange: (counts.outOfRange / counts.total) * 100,
    };
  }, [counts]);

  return (
    <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding}`}>
      {/* Counts row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <CountDisplay label="Total" count={counts.total} />
        <CountDisplay
          label="Optimal"
          count={counts.optimal}
          color={STATUS_COLORS.optimal.base}
        />
        <CountDisplay
          label="Normal"
          count={counts.normal}
          color={STATUS_COLORS.normal.base}
        />
        <CountDisplay
          label="Out of Range"
          count={counts.outOfRange}
          color={STATUS_COLORS.outOfRange.base}
        />
      </div>

      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-slate-100">
        {percentages.optimal > 0 && (
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${percentages.optimal}%`,
              backgroundColor: STATUS_COLORS.optimal.base,
            }}
          />
        )}
        {percentages.normal > 0 && (
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${percentages.normal}%`,
              backgroundColor: STATUS_COLORS.normal.base,
            }}
          />
        )}
        {percentages.outOfRange > 0 && (
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${percentages.outOfRange}%`,
              backgroundColor: STATUS_COLORS.outOfRange.base,
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
        <LegendItem color={STATUS_COLORS.optimal.base} label="Optimal" />
        <LegendItem color={STATUS_COLORS.normal.base} label="Normal" />
        <LegendItem color={STATUS_COLORS.outOfRange.base} label="Out of Range" />
      </div>
    </div>
  );
}

interface CountDisplayProps {
  label: string;
  count: number;
  color?: string;
}

function CountDisplay({ label, count, color }: CountDisplayProps): React.JSX.Element {
  return (
    <div className="text-center">
      <div
        className="text-3xl font-semibold"
        style={{ color: color || '#0f172a' }}
      >
        {count}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
}

function LegendItem({ color, label }: LegendItemProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}
