'use client';

import { useMemo } from 'react';

export interface BiomarkerRangeGraphProps {
  value: number;
  unit: string;
  standardRange?: { min?: number; max?: number };
  optimalRange?: { min?: number; max?: number };
  direction?: 'lower' | 'higher' | 'mid-range' | 'context';
}

type ZoneType = 'optimal' | 'normal' | 'outOfRange' | 'unknown';

interface RangeZone {
  start: number;
  end: number;
  type: ZoneType;
}

export function BiomarkerRangeGraph({
  value,
  unit,
  standardRange,
  optimalRange,
  direction = 'mid-range',
}: BiomarkerRangeGraphProps): React.JSX.Element {
  // Check if we have any range data to display
  const hasStandardRange = standardRange && (standardRange.min !== undefined || standardRange.max !== undefined);
  const hasOptimalRange = optimalRange && (optimalRange.min !== undefined || optimalRange.max !== undefined);
  const hasAnyRange = hasStandardRange || hasOptimalRange;

  // Calculate display bounds and zones
  const { markerPosition, zones, rangeLabels } = useMemo(() => {
    if (!hasAnyRange) {
      // No range data - show simple bar centered around value
      const buffer = Math.abs(value) * 0.5 || 10;
      return {
        displayMin: value - buffer,
        displayMax: value + buffer,
        markerPosition: 50,
        zones: [] as RangeZone[],
        rangeLabels: { left: '', right: '' },
      };
    }

    // Gather all boundary points
    const boundaries: number[] = [value];
    if (standardRange?.min !== undefined) boundaries.push(standardRange.min);
    if (standardRange?.max !== undefined) boundaries.push(standardRange.max);
    if (optimalRange?.min !== undefined) boundaries.push(optimalRange.min);
    if (optimalRange?.max !== undefined) boundaries.push(optimalRange.max);

    const minBoundary = Math.min(...boundaries);
    const maxBoundary = Math.max(...boundaries);
    const rangeSpan = maxBoundary - minBoundary || Math.abs(value) || 10;

    // Add 20% padding on each side
    const padding = rangeSpan * 0.25;
    let displayMin = minBoundary - padding;
    let displayMax = maxBoundary + padding;

    // Ensure value is visible with room
    if (value < displayMin) displayMin = value - padding;
    if (value > displayMax) displayMax = value + padding;

    // Don't go below 0 for values that can't be negative
    if (minBoundary >= 0 && displayMin < 0) displayMin = 0;

    const totalRange = displayMax - displayMin;

    // Calculate marker position (clamped to 3-97%)
    const rawPosition = ((value - displayMin) / totalRange) * 100;
    const markerPosition = Math.max(3, Math.min(97, rawPosition));

    // Build zones based on direction and available ranges
    const zones: RangeZone[] = [];
    const toPercent = (val: number): number => ((val - displayMin) / totalRange) * 100;

    // Get effective boundaries
    const stdMin = standardRange?.min ?? displayMin;
    const stdMax = standardRange?.max ?? displayMax;
    const optMin = optimalRange?.min ?? (hasOptimalRange ? stdMin : undefined);
    const optMax = optimalRange?.max ?? (hasOptimalRange ? stdMax : undefined);

    if (direction === 'context' || !hasAnyRange) {
      // Context-dependent - show neutral bar
      zones.push({ start: 0, end: 100, type: 'unknown' });
    } else if (direction === 'lower') {
      // Lower is better (e.g., LDL, glucose, triglycerides)
      // Good on left, bad on right
      if (hasOptimalRange && optMax !== undefined) {
        // Optimal zone: 0 to optMax
        zones.push({ start: 0, end: toPercent(optMax), type: 'optimal' });

        if (hasStandardRange && stdMax !== undefined && stdMax > optMax) {
          // Normal zone: optMax to stdMax
          zones.push({ start: toPercent(optMax), end: toPercent(stdMax), type: 'normal' });
          // Out of range: stdMax to end
          zones.push({ start: toPercent(stdMax), end: 100, type: 'outOfRange' });
        } else {
          // No standard range or same as optimal
          zones.push({ start: toPercent(optMax), end: 100, type: 'outOfRange' });
        }
      } else if (hasStandardRange && stdMax !== undefined) {
        // Only standard range
        zones.push({ start: 0, end: toPercent(stdMax), type: 'normal' });
        zones.push({ start: toPercent(stdMax), end: 100, type: 'outOfRange' });
      }
    } else if (direction === 'higher') {
      // Higher is better (e.g., HDL, vitamin D)
      // Bad on left, good on right
      if (hasOptimalRange && optMin !== undefined) {
        if (hasStandardRange && stdMin !== undefined && stdMin < optMin) {
          // Out of range: 0 to stdMin
          zones.push({ start: 0, end: toPercent(stdMin), type: 'outOfRange' });
          // Normal: stdMin to optMin
          zones.push({ start: toPercent(stdMin), end: toPercent(optMin), type: 'normal' });
        } else {
          // Out of range up to optimal min
          zones.push({ start: 0, end: toPercent(optMin), type: 'outOfRange' });
        }
        // Optimal zone: optMin to end
        zones.push({ start: toPercent(optMin), end: 100, type: 'optimal' });
      } else if (hasStandardRange && stdMin !== undefined) {
        // Only standard range
        zones.push({ start: 0, end: toPercent(stdMin), type: 'outOfRange' });
        zones.push({ start: toPercent(stdMin), end: 100, type: 'normal' });
      }
    } else {
      // Mid-range is best (e.g., estradiol, TSH)
      // Build zones from left to right
      // Left out-of-range zone
      if (hasStandardRange && stdMin !== undefined && stdMin > displayMin) {
        zones.push({ start: 0, end: toPercent(stdMin), type: 'outOfRange' });
      }

      // Left normal zone (between standard min and optimal min)
      if (hasOptimalRange && optMin !== undefined) {
        const normalStart = hasStandardRange && stdMin !== undefined ? toPercent(stdMin) : 0;
        if (optMin > (stdMin ?? displayMin)) {
          zones.push({ start: normalStart, end: toPercent(optMin), type: 'normal' });
        }
      }

      // Optimal zone (center)
      if (hasOptimalRange) {
        const optStart = optMin !== undefined ? toPercent(optMin) : (hasStandardRange && stdMin !== undefined ? toPercent(stdMin) : 0);
        const optEnd = optMax !== undefined ? toPercent(optMax) : (hasStandardRange && stdMax !== undefined ? toPercent(stdMax) : 100);
        zones.push({ start: optStart, end: optEnd, type: 'optimal' });
      } else if (hasStandardRange) {
        // No optimal, use standard as "acceptable"
        const normalStart = stdMin !== undefined ? toPercent(stdMin) : 0;
        const normalEnd = stdMax !== undefined ? toPercent(stdMax) : 100;
        zones.push({ start: normalStart, end: normalEnd, type: 'normal' });
      }

      // Right normal zone (between optimal max and standard max)
      if (hasOptimalRange && optMax !== undefined && hasStandardRange && stdMax !== undefined && stdMax > optMax) {
        zones.push({ start: toPercent(optMax), end: toPercent(stdMax), type: 'normal' });
      }

      // Right out-of-range zone
      if (hasStandardRange && stdMax !== undefined && stdMax < displayMax) {
        zones.push({ start: toPercent(stdMax), end: 100, type: 'outOfRange' });
      }
    }

    // Range labels for the ends
    const rangeLabels = {
      left: displayMin >= 0 ? displayMin.toFixed(displayMin < 10 ? 1 : 0) : displayMin.toFixed(1),
      right: displayMax.toFixed(displayMax < 10 ? 1 : 0),
    };

    return { displayMin, displayMax, markerPosition, zones, rangeLabels };
  }, [value, standardRange, optimalRange, direction, hasStandardRange, hasOptimalRange, hasAnyRange]);

  // Determine the marker color based on value's position
  const getValueStatus = (): ZoneType => {
    if (!hasAnyRange) return 'unknown';

    const stdMin = standardRange?.min;
    const stdMax = standardRange?.max;
    const optMin = optimalRange?.min;
    const optMax = optimalRange?.max;

    // Check optimal range first
    if (hasOptimalRange) {
      const inOptimal =
        (optMin === undefined || value >= optMin) &&
        (optMax === undefined || value <= optMax);
      if (inOptimal) return 'optimal';
    }

    // Check standard range
    if (hasStandardRange) {
      const inStandard =
        (stdMin === undefined || value >= stdMin) &&
        (stdMax === undefined || value <= stdMax);
      if (inStandard) return 'normal';
    }

    return 'outOfRange';
  };

  const valueStatus = getValueStatus();

  const zoneColors: Record<ZoneType, string> = {
    optimal: 'bg-emerald-500/20 dark:bg-emerald-400/20',
    normal: 'bg-amber-500/20 dark:bg-amber-400/20',
    outOfRange: 'bg-rose-500/20 dark:bg-rose-400/20',
    unknown: 'bg-zinc-500/20 dark:bg-zinc-400/20',
  };

  const markerColors: Record<ZoneType, string> = {
    optimal: 'bg-emerald-500',
    normal: 'bg-amber-500',
    outOfRange: 'bg-rose-500',
    unknown: 'bg-zinc-500',
  };

  const tooltipColors: Record<ZoneType, string> = {
    optimal: 'bg-emerald-600 dark:bg-emerald-500',
    normal: 'bg-amber-600 dark:bg-amber-500',
    outOfRange: 'bg-rose-600 dark:bg-rose-500',
    unknown: 'bg-zinc-600 dark:bg-zinc-500',
  };

  // If no range data at all, show a simplified view
  if (!hasAnyRange) {
    return (
      <div className="w-full">
        <div className="relative h-12 rounded-2xl overflow-hidden bg-muted/30 shadow-inner border border-border/50">
          {/* Gray neutral bar */}
          <div className="absolute inset-0 bg-zinc-500/5" />

          {/* Value marker - centered */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
            style={{ left: '50%' }}
          >
            <div className="w-1.5 h-10 rounded-full bg-zinc-500 shadow-lg" />
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap shadow-lg bg-zinc-600">
              {value} {unit}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-3">
          <span className="text-sm text-muted-foreground font-medium">Reference ranges not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Range bar */}
      <div className="relative h-12 rounded-2xl overflow-hidden bg-muted/30 shadow-inner border border-border/50">
        {/* Render zones */}
        {zones.map((zone, i) => (
          <div
            key={i}
            className={`absolute inset-y-0 ${zoneColors[zone.type]} transition-all`}
            style={{
              left: `${Math.max(0, zone.start)}%`,
              width: `${Math.min(100, zone.end) - Math.max(0, zone.start)}%`,
            }}
          />
        ))}

        {/* Zone boundary lines */}
        {zones.slice(1).map((zone, i) => (
          <div
            key={`line-${i}`}
            className="absolute inset-y-0 w-px bg-border/50"
            style={{ left: `${zone.start}%` }}
          />
        ))}

        {/* Value marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-300"
          style={{ left: `${markerPosition}%` }}
        >
          {/* Marker line with glow effect */}
          <div className={`w-1.5 h-10 rounded-full ${markerColors[valueStatus]} shadow-lg ring-2 ring-background`} />

          {/* Value tooltip */}
          <div
            className={`absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap shadow-lg ${tooltipColors[valueStatus]}`}
          >
            {value} {unit}
          </div>
        </div>
      </div>

      {/* Range labels and legend */}
      <div className="flex justify-between items-start mt-3">
        <span className="text-xs text-muted-foreground font-medium">{rangeLabels.left}</span>

        <div className="flex gap-4 text-xs font-medium">
          {zones.some(z => z.type === 'outOfRange') && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-500">Out of Range</span>
            </span>
          )}
          {zones.some(z => z.type === 'normal') && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-500">Normal</span>
            </span>
          )}
          {zones.some(z => z.type === 'optimal') && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-500">Optimal</span>
            </span>
          )}
        </div>

        <span className="text-xs text-muted-foreground font-medium">{rangeLabels.right}</span>
      </div>
    </div>
  );
}
