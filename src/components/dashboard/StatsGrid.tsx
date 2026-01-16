'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { type StatusType, STATUS_COLORS } from '@/lib/design/tokens';
import type { BiomarkerStatus } from '@/lib/types/health';

interface StatItemProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: StatusType;
  delay?: number;
}

function getStatusStyles(status: StatusType): { bg: string; text: string; dot: string } {
  switch (status) {
    case 'optimal':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    case 'outOfRange':
      return { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' };
    default:
      return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
  }
}

function getMarkerStatusColor(status: BiomarkerStatus): string {
  switch (status) {
    case 'optimal':
      return STATUS_COLORS.optimal.base;
    case 'normal':
    case 'borderline':
      return STATUS_COLORS.normal.base;
    case 'out_of_range':
      return STATUS_COLORS.outOfRange.base;
    default:
      return '#94a3b8'; // gray
  }
}

function StatItem({ label, value, unit, status = 'optimal', delay = 0 }: StatItemProps): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  const styles = getStatusStyles(status);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 transition-all duration-500 hover:shadow-md hover:border-gray-300 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900 tabular-nums">{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}

export interface TopMarker {
  name: string;
  value: number;
  unit: string;
  status: BiomarkerStatus;
}

interface StatsGridProps {
  stats: Array<{
    label: string;
    value: string | number;
    unit?: string;
    status?: StatusType;
  }>;
  biomarkerCounts: {
    optimal: number;
    normal: number;
    outOfRange: number;
  };
  topMarkers?: TopMarker[];
}

export function StatsGrid({ stats, biomarkerCounts, topMarkers }: StatsGridProps): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  const total = biomarkerCounts.optimal + biomarkerCounts.normal + biomarkerCounts.outOfRange;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`transition-all duration-700 delay-300 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
        <Link
          href="/biomarkers"
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
        >
          View all biomarkers →
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatItem
            key={stat.label}
            label={stat.label}
            value={stat.value}
            unit={stat.unit}
            status={stat.status}
            delay={index * 100}
          />
        ))}
      </div>

      {/* Biomarker summary bar */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-6">
          <span className="text-sm text-gray-600 font-medium">Biomarker Status</span>
          <div className="flex-1 flex items-center gap-3">
            {/* Stacked bar visualization */}
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden flex">
              {biomarkerCounts.optimal > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${(biomarkerCounts.optimal / total) * 100}%` }}
                />
              )}
              {biomarkerCounts.normal > 0 && (
                <div
                  className="h-full bg-amber-500 transition-all duration-1000"
                  style={{ width: `${(biomarkerCounts.normal / total) * 100}%` }}
                />
              )}
              {biomarkerCounts.outOfRange > 0 && (
                <div
                  className="h-full bg-rose-500 transition-all duration-1000"
                  style={{ width: `${(biomarkerCounts.outOfRange / total) * 100}%` }}
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-600 font-medium">{biomarkerCounts.optimal}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-gray-600 font-medium">{biomarkerCounts.normal}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-gray-600 font-medium">{biomarkerCounts.outOfRange}</span>
            </span>
          </div>
        </div>

        {/* Markers to Watch - vertical list below biomarker bar */}
        {topMarkers && topMarkers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 font-medium">Markers to Watch</span>
            </div>
            <div className="flex flex-col gap-2">
              {topMarkers.slice(0, 5).map((marker) => (
                <Link
                  key={marker.name}
                  href="/biomarkers"
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getMarkerStatusColor(marker.status) }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {marker.name}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 ml-4 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      {formatValue(marker.value)}
                    </span>
                    <span className="text-xs text-gray-500">{marker.unit}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatValue(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(1);
}
