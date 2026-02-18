'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { InsightCard, type InsightStatus } from '@/components/insights/InsightCard';
import { STATUS_COLORS } from '@/lib/design/tokens';
import type { BodyComposition } from '@/lib/extractors/body-comp';

// Lazy load heavy chart components
const CompositionChart = dynamic(() => import('@/components/charts/CompositionChart'), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-xl" />,
});

const FatDistributionChart = dynamic(() => import('@/components/charts/FatDistributionChart'), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-xl" />,
});

const SegmentalBodyComposition = dynamic(
  () => import('@/components/body-comp/SegmentalBodyComposition'),
  {
    ssr: false,
    loading: () => <div className="h-80 bg-muted/20 animate-pulse rounded-2xl" />,
  }
);

interface BodyCompClientProps {
  bodyComp: BodyComposition;
}

// Body fat thresholds for men (can be refined for women)
function getBodyFatStatus(bf: number): InsightStatus {
  if (bf <= 15) return 'optimal';
  if (bf <= 25) return 'warning';
  return 'critical';
}

// Visceral fat thresholds (DEXA units)
function getVisceralFatStatus(vf: number): InsightStatus {
  if (vf <= 1.0) return 'optimal';
  if (vf <= 2.0) return 'warning';
  return 'critical';
}

// ALMI thresholds for men
function getAlmiStatus(almi: number): InsightStatus {
  if (almi >= 7.5) return 'optimal';
  if (almi >= 6.5) return 'warning';
  return 'critical';
}

// Lean mass - higher is generally better
function getLeanMassStatus(lm: number, bf: number | undefined): InsightStatus {
  // If body fat is available, use ratio; otherwise, use absolute values
  if (bf !== undefined && bf <= 20) return 'optimal';
  if (lm >= 140) return 'optimal';
  if (lm >= 120) return 'warning';
  return 'critical';
}

const BODY_FAT_TIPS = [
  'Create a modest caloric deficit (300-500 calories/day)',
  'Prioritize protein intake (1g per lb lean body mass)',
  'Incorporate strength training 3-4x per week',
  'Focus on whole foods, limit processed foods',
  'Track progress with DEXA scans quarterly',
];

const VISCERAL_FAT_TIPS = [
  'Reduce refined carbs and added sugars',
  'Increase aerobic exercise frequency',
  'Practice stress management techniques',
  'Prioritize 7-8 hours of quality sleep',
  'Consider time-restricted eating (12-16 hour fast)',
];

const LEAN_MASS_TIPS = [
  'Progressive resistance training 3-4x weekly',
  'Consume 1.6-2.2g protein per kg body weight',
  'Ensure adequate recovery between workouts',
  'Focus on compound movements (squat, deadlift, bench)',
  'Consider creatine supplementation (5g/day)',
];

const ALMI_TIPS = [
  'Focus on building and maintaining muscle mass',
  'Ensure adequate protein throughout the day',
  'Include resistance training in your routine',
  'Consider working with a strength coach',
  'Monitor muscle mass trends with regular DEXA scans',
];

const CHART_COLORS = {
  fat: '#f97316', // Orange
  lean: STATUS_COLORS.optimal.base, // Green
  bone: '#6366f1', // Indigo
};

const PERIOD_OPTIONS = ['Week', 'Month', 'Quarter', 'Semester', 'Year', 'All'] as const;

function getPeriodRangeLabel(scanDate: string | undefined, period: (typeof PERIOD_OPTIONS)[number]): string {
  const end = scanDate ? new Date(scanDate) : new Date();
  const start = new Date(end);

  switch (period) {
    case 'Week':
      start.setDate(end.getDate() - 7);
      break;
    case 'Month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'Quarter':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'Semester':
      start.setMonth(end.getMonth() - 6);
      break;
    case 'Year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'All':
      start.setFullYear(end.getFullYear() - 5);
      break;
    default:
      start.setMonth(end.getMonth() - 1);
      break;
  }

  const format = (value: Date): string =>
    value.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return `${format(start)} - ${format(end)}`;
}

export function BodyCompClient({ bodyComp }: BodyCompClientProps): React.JSX.Element {
  const [periodIndex, setPeriodIndex] = useState(1);
  const {
    bodyFatPercent = 0,
    leanMass = 0,
    fatMass = 0,
    visceralFat = 0,
    vatMass = 0,
    almi = 0,
    boneMineralContent = 0,
    // Regional data
    armsFatPercent,
    legsFatPercent,
    trunkFatPercent,
    androidFatPercent,
    gynoidFatPercent,
    agRatio,
    // Metabolic
    restingMetabolicRate,
    // Bone
    boneDensityTScore,
    boneDensityZScore,
    totalBmd,
  } = bodyComp;

  // Use vatMass if visceralFat is 0
  const actualVisceralFat = visceralFat || vatMass;

  const hasData = bodyFatPercent > 0 || leanMass > 0;
  const totalMass = leanMass + fatMass + boneMineralContent;

  // Prepare chart data - useMemo for performance
  const compositionData = useMemo(() => [
    { name: 'Lean Mass', value: leanMass, color: CHART_COLORS.lean },
    { name: 'Fat Mass', value: fatMass, color: CHART_COLORS.fat },
    { name: 'Bone', value: boneMineralContent, color: CHART_COLORS.bone },
  ].filter((d) => d.value > 0), [leanMass, fatMass, boneMineralContent]);

  const pieData = useMemo(() => [
    { name: 'Lean', value: leanMass + boneMineralContent, color: CHART_COLORS.lean },
    { name: 'Fat', value: fatMass, color: CHART_COLORS.fat },
  ].filter((d) => d.value > 0), [leanMass, boneMineralContent, fatMass]);

  const selectedPeriod = PERIOD_OPTIONS[periodIndex];
  const selectedRangeLabel = getPeriodRangeLabel(bodyComp.scanDate, selectedPeriod);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Body Composition</h1>
        <p className="text-muted-foreground mt-1">Your DEXA scan analysis and body metrics</p>
        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {PERIOD_OPTIONS.map((period, index) => (
              <button
                key={period}
                type="button"
                onClick={() => setPeriodIndex(index)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  periodIndex === index
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-secondary/50 px-2 py-2">
            <button
              type="button"
              onClick={() => setPeriodIndex((prev) => (prev - 1 + PERIOD_OPTIONS.length) % PERIOD_OPTIONS.length)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-base font-medium text-foreground">{selectedRangeLabel}</p>
            <button
              type="button"
              onClick={() => setPeriodIndex((prev) => (prev + 1) % PERIOD_OPTIONS.length)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="vitals-fade-in vitals-fade-in-delay-1">
          <InsightCard
            title="Body Fat"
            value={bodyFatPercent.toFixed(1)}
            unit="%"
            status={getBodyFatStatus(bodyFatPercent)}
            subtitle="Total body fat percentage"
            actionItems={BODY_FAT_TIPS}
          />
        </div>
        <div className="vitals-fade-in vitals-fade-in-delay-2">
          <InsightCard
            title="Lean Mass"
            value={leanMass.toFixed(1)}
            unit="lbs"
            status={getLeanMassStatus(leanMass, bodyFatPercent)}
            subtitle="Muscle and organ tissue"
            actionItems={LEAN_MASS_TIPS}
          />
        </div>
        <div className="vitals-fade-in vitals-fade-in-delay-3">
          <InsightCard
            title="Visceral Fat"
            value={actualVisceralFat.toFixed(2)}
            unit="lbs"
            status={getVisceralFatStatus(actualVisceralFat)}
            subtitle="Internal organ fat"
            actionItems={VISCERAL_FAT_TIPS}
          />
        </div>
        <div className="vitals-fade-in vitals-fade-in-delay-4">
          <InsightCard
            title="ALMI"
            value={almi.toFixed(2)}
            unit="kg/m²"
            status={getAlmiStatus(almi)}
            subtitle="Appendicular lean mass index"
            actionItems={ALMI_TIPS}
          />
        </div>
      </div>

      {/* Charts Section */}
      {hasData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Body Composition Breakdown */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Composition Breakdown</h3>
              <CompositionChart data={compositionData} totalMass={totalMass} />
            </div>

            {/* Fat vs Lean Distribution */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Fat vs Lean Distribution</h3>
              <FatDistributionChart data={pieData} />
            </div>
          </div>

          {/* Regional Fat Distribution & Additional Metrics */}
          {(androidFatPercent !== undefined || restingMetabolicRate !== undefined) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Regional Fat Distribution */}
              {androidFatPercent !== undefined && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Regional Fat Distribution</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Arms', value: armsFatPercent, color: '#60a5fa' },
                      { name: 'Legs', value: legsFatPercent, color: '#34d399' },
                      { name: 'Trunk', value: trunkFatPercent, color: '#fbbf24' },
                      { name: 'Android (Belly)', value: androidFatPercent, color: '#f87171' },
                      { name: 'Gynoid (Hips)', value: gynoidFatPercent, color: '#a78bfa' },
                    ]
                      .filter((r) => r.value !== undefined)
                      .map((region) => (
                        <div key={region.name} className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-28">{region.name}</span>
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min((region.value ?? 0) / 50 * 100, 100)}%`,
                                backgroundColor: region.color,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground w-14 text-right">
                            {region.value?.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                  </div>
                  {agRatio !== undefined && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">A/G Ratio</span>
                        <span className={`text-sm font-semibold ${agRatio > 1 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {agRatio.toFixed(2)} {agRatio > 1 ? '(High)' : '(Good)'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Target: &lt; 1.0 — Lower ratios indicate healthier fat distribution
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Metrics */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Additional Metrics</h3>
                <div className="space-y-4">
                  {restingMetabolicRate !== undefined && (
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <div>
                        <span className="text-sm font-medium text-foreground">Resting Metabolic Rate</span>
                        <p className="text-xs text-muted-foreground">Minimum daily calories at rest</p>
                      </div>
                      <span className="text-lg font-semibold text-foreground">
                        {restingMetabolicRate.toLocaleString()} <span className="text-sm text-muted-foreground">cal/day</span>
                      </span>
                    </div>
                  )}
                  {(boneDensityTScore !== undefined || boneDensityZScore !== undefined) && (
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <div>
                        <span className="text-sm font-medium text-foreground">Bone Density</span>
                        <p className="text-xs text-muted-foreground">Age-matched comparison</p>
                      </div>
                      <div className="text-right">
                        {boneDensityTScore !== undefined && (
                          <span className="text-lg font-semibold text-foreground">
                            T: {boneDensityTScore > 0 ? '+' : ''}{boneDensityTScore.toFixed(1)}
                          </span>
                        )}
                        {boneDensityZScore !== undefined && (
                          <span className="text-sm text-muted-foreground ml-2">
                            Z: {boneDensityZScore > 0 ? '+' : ''}{boneDensityZScore.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {totalBmd !== undefined && (
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <div>
                        <span className="text-sm font-medium text-foreground">Total BMD</span>
                        <p className="text-xs text-muted-foreground">Bone mineral density</p>
                      </div>
                      <span className="text-lg font-semibold text-foreground">
                        {totalBmd.toFixed(3)} <span className="text-sm text-muted-foreground">g/cm²</span>
                      </span>
                    </div>
                  )}
                  {boneMineralContent > 0 && (
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm font-medium text-foreground">Bone Mineral Content</span>
                        <p className="text-xs text-muted-foreground">Total bone mass</p>
                      </div>
                      <span className="text-lg font-semibold text-foreground">
                        {boneMineralContent.toFixed(1)} <span className="text-sm text-muted-foreground">lbs</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Segmental Body Composition — Withings Body Scan / DEXA */}
          <div className="mt-6">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Segmental Body Composition</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Gender-specific arm, trunk &amp; leg fat/muscle analysis</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Withings Body Scan · DEXA
                </span>
              </div>
              <SegmentalBodyComposition data={bodyComp} />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 text-center py-12">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-muted">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No body composition data</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Add a DEXA scan file to your /data folder to see your body composition analysis.
          </p>
        </div>
      )}
    </div>
  );
}
