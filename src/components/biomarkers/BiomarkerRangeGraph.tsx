'use client';

import { useMemo } from 'react';

export interface BiomarkerRangeGraphProps {
  value: number;
  unit: string;
  standardRange?: { min?: number; max?: number };
  optimalRange?: { min?: number; max?: number };
  direction?: 'lower' | 'higher' | 'mid-range' | 'context';
}

export function BiomarkerRangeGraph({
  value,
  unit,
  standardRange,
  optimalRange,
  direction = 'mid-range',
}: BiomarkerRangeGraphProps): React.JSX.Element {
  // Calculate the display range and marker position
  const { displayMin, displayMax, markerPosition, zones } = useMemo(() => {
    // Determine reasonable bounds for the visualization
    let min = 0;
    let max = value * 2;

    if (standardRange?.min !== undefined) min = Math.min(min, standardRange.min * 0.8);
    if (standardRange?.max !== undefined) max = Math.max(max, standardRange.max * 1.2);
    if (optimalRange?.min !== undefined) min = Math.min(min, optimalRange.min * 0.8);
    if (optimalRange?.max !== undefined) max = Math.max(max, optimalRange.max * 1.2);

    // Ensure value is visible
    min = Math.min(min, value * 0.8);
    max = Math.max(max, value * 1.2);

    const range = max - min;
    const position = ((value - min) / range) * 100;

    // Calculate zone positions
    const optMin = optimalRange?.min ?? min;
    const optMax = optimalRange?.max ?? max;
    const stdMin = standardRange?.min ?? min;
    const stdMax = standardRange?.max ?? max;

    const optMinPos = ((optMin - min) / range) * 100;
    const optMaxPos = ((optMax - min) / range) * 100;
    const stdMinPos = ((stdMin - min) / range) * 100;
    const stdMaxPos = ((stdMax - min) / range) * 100;

    return {
      displayMin: min,
      displayMax: max,
      markerPosition: Math.max(2, Math.min(98, position)),
      zones: {
        optMinPos: Math.max(0, optMinPos),
        optMaxPos: Math.min(100, optMaxPos),
        stdMinPos: Math.max(0, stdMinPos),
        stdMaxPos: Math.min(100, stdMaxPos),
      },
    };
  }, [value, standardRange, optimalRange]);

  // Determine which zone the value is in
  const getValueZone = (): 'optimal' | 'normal' | 'outOfRange' => {
    if (optimalRange) {
      const inOptimal =
        (optimalRange.min === undefined || value >= optimalRange.min) &&
        (optimalRange.max === undefined || value <= optimalRange.max);
      if (inOptimal) return 'optimal';
    }

    if (standardRange) {
      const inStandard =
        (standardRange.min === undefined || value >= standardRange.min) &&
        (standardRange.max === undefined || value <= standardRange.max);
      if (inStandard) return 'normal';
    }

    return 'outOfRange';
  };

  const valueZone = getValueZone();
  const markerColors = {
    optimal: 'bg-emerald-600',
    normal: 'bg-amber-500',
    outOfRange: 'bg-rose-500',
  };

  return (
    <div className="w-full">
      {/* Range bar */}
      <div className="relative h-10 rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
        {/* Out of range zones (edges) */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-200 to-rose-100"
          style={{ width: `${zones.stdMinPos}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-rose-200 to-rose-100"
          style={{ width: `${100 - zones.stdMaxPos}%` }}
        />

        {/* Normal zone */}
        <div
          className="absolute inset-y-0 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100"
          style={{
            left: `${zones.stdMinPos}%`,
            width: `${zones.optMinPos - zones.stdMinPos}%`,
          }}
        />
        <div
          className="absolute inset-y-0 bg-gradient-to-l from-amber-100 via-amber-50 to-amber-100"
          style={{
            left: `${zones.optMaxPos}%`,
            width: `${zones.stdMaxPos - zones.optMaxPos}%`,
          }}
        />

        {/* Optimal zone */}
        <div
          className="absolute inset-y-0 bg-gradient-to-r from-emerald-100 via-emerald-50 to-emerald-100"
          style={{
            left: `${zones.optMinPos}%`,
            width: `${zones.optMaxPos - zones.optMinPos}%`,
          }}
        />

        {/* Value marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
          style={{ left: `${markerPosition}%` }}
        >
          {/* Marker line */}
          <div className={`w-1 h-8 rounded-full ${markerColors[valueZone]} shadow-md`} />
          {/* Value tooltip */}
          <div
            className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-semibold text-white whitespace-nowrap shadow-lg ${markerColors[valueZone]}`}
          >
            {value} {unit}
          </div>
        </div>
      </div>

      {/* Zone labels */}
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span className="text-rose-500 font-medium">Out of Range</span>
        <span className="text-amber-600 font-medium">Normal</span>
        <span className="text-emerald-600 font-medium">Optimal</span>
        <span className="text-amber-600 font-medium">Normal</span>
        <span className="text-rose-500 font-medium">Out of Range</span>
      </div>
    </div>
  );
}
