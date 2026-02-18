'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleHelp } from 'lucide-react';
import type { BodyComposition } from '@/lib/extractors/body-comp';
import SegmentalBodyCompositionClassic from './SegmentalBodyCompositionClassic';

type ExplorerMode = 'fat' | 'muscle';
type SegmentKey = 'arms' | 'torso' | 'legs';
type SegmentalViewMode = 'classic' | 'explorer';

interface SegmentMetric {
  key: SegmentKey;
  label: string;
  side: 'left' | 'right';
  anchorX: number;
  anchorY: number;
  calloutY: number;
  fatPercent: number;
  musclePercent: number;
}

interface ExplorerSnapshot {
  dateLabel: string;
  segments: SegmentMetric[];
}

interface SegmentalBodyCompositionProps {
  data?: Partial<BodyComposition>;
}

const ZONE_LABELS = ['Lowest', 'Low', 'Middle', 'High', 'Highest'] as const;
const FAT_ZONE_STOPS = [18, 24, 30, 36];
const MUSCLE_ZONE_STOPS = [58, 64, 70, 76];

const FAT_GRADIENT = ['#f2e9f8', '#d8c0ec', '#be9ddd', '#9f79cb', '#8a67c4'];
const MUSCLE_GRADIENT = ['#daf4ed', '#bce8db', '#9adccf', '#76cec1', '#53bcb0'];

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getZoneIndex(value: number, mode: ExplorerMode): number {
  const thresholds = mode === 'fat' ? FAT_ZONE_STOPS : MUSCLE_ZONE_STOPS;
  for (let index = 0; index < thresholds.length; index += 1) {
    if (value < thresholds[index]) {
      return index;
    }
  }
  return thresholds.length;
}

function getZoneLabel(value: number, mode: ExplorerMode): (typeof ZONE_LABELS)[number] {
  return ZONE_LABELS[getZoneIndex(value, mode)];
}

function buildBaseSegments(data?: Partial<BodyComposition>): SegmentMetric[] {
  const armsFat = data?.armsFatPercent ?? 23.8;
  const torsoFat = data?.trunkFatPercent ?? 34;
  const legsFat = data?.legsFatPercent ?? 25.6;

  const muscleFromFat = (fatValue: number): number => clampPercent(100 - fatValue);

  const armsMuscle = muscleFromFat(armsFat);
  const torsoMuscle = muscleFromFat(torsoFat);
  const legsMuscle = muscleFromFat(legsFat);

  return [
    {
      key: 'arms',
      label: 'Arms',
      side: 'left',
      anchorX: 35,
      anchorY: 43,
      calloutY: 33,
      fatPercent: armsFat,
      musclePercent: armsMuscle,
    },
    {
      key: 'torso',
      label: 'Torso',
      side: 'right',
      anchorX: 53,
      anchorY: 43,
      calloutY: 40,
      fatPercent: torsoFat,
      musclePercent: torsoMuscle,
    },
    {
      key: 'legs',
      label: 'Legs',
      side: 'left',
      anchorX: 45,
      anchorY: 71,
      calloutY: 62,
      fatPercent: legsFat,
      musclePercent: legsMuscle,
    },
  ];
}

function buildSnapshots(baseSegments: SegmentMetric[]): ExplorerSnapshot[] {
  const frames = [
    { dateLabel: 'Feb 14, 2026 at 1:52PM', delta: 0 },
    { dateLabel: 'Feb 10, 2026 at 8:14AM', delta: 0.7 },
    { dateLabel: 'Feb 06, 2026 at 7:01PM', delta: 1.1 },
    { dateLabel: 'Feb 02, 2026 at 9:26AM', delta: 1.5 },
  ];

  return frames.map((frame) => ({
    dateLabel: frame.dateLabel,
    segments: baseSegments.map((segment) => ({
      ...segment,
      fatPercent: clampPercent(segment.fatPercent + frame.delta),
      musclePercent: clampPercent(segment.musclePercent - frame.delta),
    })),
  }));
}

function getModeValue(segment: SegmentMetric, mode: ExplorerMode): number {
  return mode === 'fat' ? segment.fatPercent : segment.musclePercent;
}

function getModeLabel(segment: SegmentMetric, mode: ExplorerMode): string {
  if (mode === 'fat') {
    if (segment.key === 'torso') return 'TORSO';
    return `AVG. ${segment.label.toUpperCase()}`;
  }
  if (segment.key === 'torso') return 'TORSO';
  return `TOTAL ${segment.label.toUpperCase()}`;
}

function ExplorerBody({
  mode,
  segments,
}: {
  mode: ExplorerMode;
  segments: SegmentMetric[];
}): React.JSX.Element {
  const getColor = (segmentKey: SegmentKey): string => {
    const segment = segments.find((entry) => entry.key === segmentKey);
    if (!segment) return '#d8d8d8';
    const value = getModeValue(segment, mode);
    const index = getZoneIndex(value, mode);
    const palette = mode === 'fat' ? FAT_GRADIENT : MUSCLE_GRADIENT;
    return palette[index];
  };

  return (
    <svg
      viewBox="0 0 120 280"
      className="mx-auto h-[500px] w-[220px] sm:h-[560px] sm:w-[260px]"
      aria-label="Segmental body explorer"
    >
      <defs>
        <filter id="segmentGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="60" cy="22" rx="14" ry="17" fill="#b6bac0" />
      <rect x="55" y="36" width="10" height="10" rx="4" fill="#a6abb1" />

      <path
        d="M 44 50 Q 38 70 36 90 Q 38 110 44 118 Q 52 126 60 126 Q 68 126 76 118 Q 82 110 84 90 Q 82 70 76 50 Q 68 44 60 44 Q 52 44 44 50 Z"
        fill="#dadde2"
      />
      <path
        d="M 38 52 Q 28 80 26 120 Q 28 130 34 128 Q 40 126 40 116 Q 42 80 46 56 Z"
        fill="#dadde2"
      />
      <path
        d="M 82 52 Q 92 80 94 120 Q 92 130 86 128 Q 80 126 80 116 Q 78 80 74 56 Z"
        fill="#dadde2"
      />
      <path
        d="M 44 124 Q 40 150 38 180 Q 36 210 38 240 Q 40 252 46 252 Q 52 252 54 240 Q 56 210 56 180 Q 56 150 54 124 Z"
        fill="#dadde2"
      />
      <path
        d="M 76 124 Q 80 150 82 180 Q 84 210 82 240 Q 80 252 74 252 Q 68 252 66 240 Q 64 210 64 180 Q 64 150 66 124 Z"
        fill="#dadde2"
      />

      <path
        d="M 44 50 Q 38 70 36 90 Q 38 110 44 118 Q 52 126 60 126 Q 68 126 76 118 Q 82 110 84 90 Q 82 70 76 50 Q 68 44 60 44 Q 52 44 44 50 Z"
        fill={getColor('torso')}
        opacity={0.75}
        filter="url(#segmentGlow)"
      />
      <path
        d="M 38 52 Q 28 80 26 120 Q 28 130 34 128 Q 40 126 40 116 Q 42 80 46 56 Z"
        fill={getColor('arms')}
        opacity={0.75}
      />
      <path
        d="M 82 52 Q 92 80 94 120 Q 92 130 86 128 Q 80 126 80 116 Q 78 80 74 56 Z"
        fill={getColor('arms')}
        opacity={0.75}
      />
      <path
        d="M 44 124 Q 40 150 38 180 Q 36 210 38 240 Q 40 252 46 252 Q 52 252 54 240 Q 56 210 56 180 Q 56 150 54 124 Z"
        fill={getColor('legs')}
        opacity={0.75}
      />
      <path
        d="M 76 124 Q 80 150 82 180 Q 84 210 82 240 Q 80 252 74 252 Q 68 252 66 240 Q 64 210 64 180 Q 64 150 66 124 Z"
        fill={getColor('legs')}
        opacity={0.75}
      />
    </svg>
  );
}

function SegmentalBodyCompositionExplorer({
  data,
}: SegmentalBodyCompositionProps): React.JSX.Element {
  const [mode, setMode] = useState<ExplorerMode>('fat');
  const [snapshotIndex, setSnapshotIndex] = useState(0);

  const snapshots = useMemo(() => {
    const base = buildBaseSegments(data);
    return buildSnapshots(base);
  }, [data]);

  const activeSnapshot = snapshots[snapshotIndex];
  const activeSegments = activeSnapshot.segments;
  const gradient = mode === 'fat' ? FAT_GRADIENT : MUSCLE_GRADIENT;

  const nextSnapshot = (): void => {
    setSnapshotIndex((prev) => (prev + 1) % snapshots.length);
  };

  const previousSnapshot = (): void => {
    setSnapshotIndex((prev) => (prev - 1 + snapshots.length) % snapshots.length);
  };

  return (
    <section className="rounded-[2rem] border border-white/12 bg-[linear-gradient(170deg,#2a2929_0%,#111317_68%)] p-4 text-white shadow-2xl sm:p-6">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="h-11 w-11 rounded-full border border-white/20 bg-black/35 text-white/80 transition hover:bg-black/55"
            aria-label="Close explorer"
          >
            ×
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Explorer</p>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/80 transition hover:bg-black/55"
            aria-label="Explorer help"
          >
            <CircleHelp className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 rounded-full bg-white/12 p-1">
          <button
            type="button"
            onClick={() => setMode('fat')}
            className={`rounded-full px-4 py-2 text-base font-semibold transition ${
              mode === 'fat' ? 'bg-white/35 text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Fat
          </button>
          <button
            type="button"
            onClick={() => setMode('muscle')}
            className={`rounded-full px-4 py-2 text-base font-semibold transition ${
              mode === 'muscle' ? 'bg-white/35 text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Muscle
          </button>
        </div>
      </header>

      <div className="mt-4 flex items-center justify-between text-white/85">
        <button
          type="button"
          onClick={previousSnapshot}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 transition hover:bg-black/55"
          aria-label="Previous measurement"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-lg font-medium">{activeSnapshot.dateLabel}</p>
        <button
          type="button"
          onClick={nextSnapshot}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 transition hover:bg-black/55"
          aria-label="Next measurement"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="relative mt-5 min-h-[560px]">
        <ExplorerBody mode={mode} segments={activeSegments} />

        {activeSegments.map((segment) => {
          const value = getModeValue(segment, mode);
          const zone = getZoneLabel(value, mode);

          return (
            <div key={segment.key}>
              <div
                className="absolute z-20 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/90 shadow-[0_10px_25px_rgba(0,0,0,0.45)]"
                style={{ left: `${segment.anchorX}%`, top: `${segment.anchorY}%` }}
              >
                <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
              </div>

              <div
                className={`absolute z-10 w-[170px] rounded-3xl border border-white/10 bg-black/55 p-4 backdrop-blur-md sm:w-[220px] ${
                  segment.side === 'left' ? 'left-0 sm:left-2' : 'right-0 sm:right-2'
                }`}
                style={{ top: `${segment.calloutY}%` }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
                  {getModeLabel(segment, mode)}
                </p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-5xl font-semibold leading-none tracking-tight">
                    {value.toFixed(1)}%
                  </span>
                </div>
                <p className="mt-1 text-3xl font-light text-white/85">{zone}</p>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="rounded-3xl border border-white/15 bg-black/30 p-4 sm:p-5">
        <p className="text-center text-lg leading-snug text-white/75">
          Results are in relation to peers with similar age and BMI.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {gradient.map((color, index) => (
            <div key={color} className="space-y-1 text-center">
              <div
                className="h-6 rounded-xl"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <p className="text-xs text-white/75">{ZONE_LABELS[index]}</p>
            </div>
          ))}
        </div>
      </footer>
    </section>
  );
}

export default function SegmentalBodyComposition({
  data,
}: SegmentalBodyCompositionProps): React.JSX.Element {
  const [viewMode, setViewMode] = useState<SegmentalViewMode>('explorer');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Segmental Body Composition
          </p>
          <p className="text-sm text-muted-foreground">
            Choose classic analytics or the new Withings-style explorer.
          </p>
        </div>
        <div className="grid grid-cols-2 rounded-full border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => setViewMode('classic')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              viewMode === 'classic'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Classic
          </button>
          <button
            type="button"
            onClick={() => setViewMode('explorer')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              viewMode === 'explorer'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Explorer
          </button>
        </div>
      </div>

      {viewMode === 'classic' ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <SegmentalBodyCompositionClassic />
        </div>
      ) : (
        <SegmentalBodyCompositionExplorer data={data} />
      )}
    </div>
  );
}
