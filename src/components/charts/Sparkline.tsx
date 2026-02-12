'use client';

import { useMemo } from 'react';
import { STATUS_COLORS, type StatusType } from '@/lib/design/tokens';

interface SparklineProps {
  data: number[];
  status: StatusType;
  optimalRange?: { min?: number; max?: number };
  currentValue?: number;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  status,
  optimalRange,
  width = 120,
  height = 40,
}: SparklineProps): React.JSX.Element {
  const { path, points, rangeY } = useMemo(() => {
    if (data.length === 0) {
      return { path: '', points: [], rangeY: null };
    }

    // Calculate bounds
    const allValues = [...data];
    if (optimalRange) {
      if (optimalRange.min !== undefined) allValues.push(optimalRange.min);
      if (optimalRange.max !== undefined) allValues.push(optimalRange.max);
    }

    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = maxVal - minVal || 1;
    const padding = 4;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    // Generate points
    const pts = data.map((value, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * effectiveWidth;
      const y = padding + (1 - (value - minVal) / range) * effectiveHeight;
      return { x, y, value };
    });

    // Generate path
    const pathStr = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    // Calculate optimal range band Y coordinates
    let rangeYCoords = null;
    if (optimalRange && (optimalRange.min !== undefined || optimalRange.max !== undefined)) {
      const rangeMinVal = optimalRange.min ?? minVal;
      const rangeMaxVal = optimalRange.max ?? maxVal;
      rangeYCoords = {
        top: padding + (1 - (rangeMaxVal - minVal) / range) * effectiveHeight,
        bottom: padding + (1 - (rangeMinVal - minVal) / range) * effectiveHeight,
      };
    }

    return { path: pathStr, points: pts, rangeY: rangeYCoords };
  }, [data, optimalRange, width, height]);

  const lineColor = STATUS_COLORS[status].base;
  const lastPoint = points[points.length - 1];

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-xs"
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      aria-label={`Sparkline showing ${data.length} data points`}
    >
      {/* Optimal range background band */}
      {rangeY && (
        <rect
          x={0}
          y={rangeY.top}
          width={width}
          height={Math.max(rangeY.bottom - rangeY.top, 1)}
          fill={STATUS_COLORS.optimal.light}
          opacity={0.5}
        />
      )}

      {/* Sparkline path */}
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Current value dot */}
      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={4}
          fill={lineColor}
          stroke="white"
          strokeWidth={2}
        />
      )}
    </svg>
  );
}
