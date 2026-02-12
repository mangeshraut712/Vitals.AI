'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { InsightCard, type InsightStatus } from '@/components/insights/InsightCard';
import type { ActivityData } from '@/lib/store/health-data';
import type { WhoopWorkout } from '@/lib/parsers/whoop';

// Lazy load heavy chart components
const HRVTrendChart = dynamic(() => import('@/components/charts/HRVTrendChart'), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-xl" />,
});

const SleepChart = dynamic(() => import('@/components/charts/SleepChart'), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-xl" />,
});

const RHRTrendChart = dynamic(() => import('@/components/charts/RHRTrendChart'), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-xl" />,
});

interface LifestyleClientProps {
  activityData: ActivityData[];
  averages: {
    avgHrv: number;
    avgRhr: number;
    avgSleep: number;
    avgSleepScore: number;
    avgStrain: number;
    avgRecovery: number;
  };
  recentWorkouts: WhoopWorkout[];
}

// HRV thresholds - higher is better
function getHrvStatus(hrv: number): InsightStatus {
  if (hrv >= 60) return 'optimal';
  if (hrv >= 40) return 'warning';
  return 'critical';
}

// RHR thresholds - lower is better
function getRhrStatus(rhr: number): InsightStatus {
  if (rhr <= 55) return 'optimal';
  if (rhr <= 70) return 'warning';
  return 'critical';
}

// Sleep score thresholds
function getSleepStatus(score: number): InsightStatus {
  if (score >= 80) return 'optimal';
  if (score >= 60) return 'warning';
  return 'critical';
}

// Strain thresholds - moderate is optimal
function getStrainStatus(strain: number): InsightStatus {
  if (strain >= 10 && strain <= 16) return 'optimal';
  if (strain >= 6 && strain <= 18) return 'warning';
  return 'critical';
}

// Recovery thresholds - higher is better
function getRecoveryStatus(recovery: number): InsightStatus {
  if (recovery >= 67) return 'optimal';
  if (recovery >= 34) return 'warning';
  return 'critical';
}

const HRV_TIPS = [
  'Practice deep breathing exercises for 5-10 minutes daily',
  'Prioritize 7-9 hours of quality sleep',
  'Reduce alcohol consumption, especially before bed',
  'Manage stress through meditation or yoga',
  'Stay hydrated throughout the day',
];

const SLEEP_TIPS = [
  'Maintain consistent sleep and wake times',
  'Keep bedroom cool (65-68°F / 18-20°C)',
  'Avoid screens 1 hour before bed',
  'Limit caffeine after 2pm',
  'Create a relaxing bedtime routine',
];

const RHR_TIPS = [
  'Regular aerobic exercise (30 min, 5x per week)',
  'Practice relaxation techniques',
  'Maintain healthy weight',
  'Stay well hydrated',
  'Reduce caffeine and alcohol intake',
];

const STRAIN_TIPS = [
  'Balance workout intensity with recovery days',
  'Track daily strain to avoid overtraining',
  'Listen to your body signals',
  'Include mobility and stretching work',
  'Ensure adequate nutrition for activity level',
];

const RECOVERY_TIPS = [
  'Prioritize quality sleep (7-9 hours)',
  'Stay hydrated throughout the day',
  'Reduce stress through meditation or relaxation',
  'Allow adequate rest between intense workouts',
  'Focus on nutrition with whole foods and protein',
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getWorkoutColor(strain: number | null): string {
  if (strain === null) return '#94a3b8'; // gray
  if (strain >= 18) return '#ef4444'; // red - very high
  if (strain >= 14) return '#f97316'; // orange - high
  if (strain >= 10) return '#22c55e'; // green - optimal
  if (strain >= 6) return '#3b82f6'; // blue - moderate
  return '#94a3b8'; // gray - light
}

export function LifestyleClient({
  activityData,
  averages,
  recentWorkouts,
}: LifestyleClientProps): React.JSX.Element {
  const { avgHrv, avgRhr, avgSleepScore, avgStrain, avgRecovery } = averages;

  // Prepare chart data with formatted dates - useMemo for performance
  const chartData = useMemo(() => activityData.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
  })), [activityData]);

  const hasData = activityData.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <header className="vitals-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Lifestyle</h1>
        <p className="text-muted-foreground mt-1">Your daily activity and recovery metrics</p>
      </header>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="vitals-fade-in vitals-fade-in-delay-1">
          <InsightCard
            title="Recovery"
            value={avgRecovery}
            unit="%"
            status={getRecoveryStatus(avgRecovery)}
            subtitle="7-day average"
            actionItems={RECOVERY_TIPS}
          />
        </div>
        <div className="vitals-fade-in vitals-fade-in-delay-2">
          <InsightCard
            title="HRV"
            value={avgHrv}
            unit="ms"
            status={getHrvStatus(avgHrv)}
            subtitle="7-day average"
            actionItems={HRV_TIPS}
          />
        </div>
        <div className="vitals-fade-in vitals-fade-in-delay-3">
          <InsightCard
            title="Sleep Score"
            value={avgSleepScore}
            unit="%"
            status={getSleepStatus(avgSleepScore)}
            subtitle="7-day average"
            actionItems={SLEEP_TIPS}
          />
        </div>
        <div className="vitals-fade-in vitals-fade-in-delay-4">
          <InsightCard
            title="Resting HR"
            value={avgRhr}
            unit="bpm"
            status={getRhrStatus(avgRhr)}
            subtitle="7-day average"
            actionItems={RHR_TIPS}
          />
        </div>
        <div className="vitals-fade-in vitals-fade-in-delay-5">
          <InsightCard
            title="Strain"
            value={avgStrain}
            unit=""
            status={getStrainStatus(avgStrain)}
            subtitle="7-day average"
            actionItems={STRAIN_TIPS}
          />
        </div>
      </div>

      {/* Charts Section */}
      {hasData ? (
        <div className="space-y-6">
          {/* HRV Trend Chart */}
          <div className="vitals-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">HRV Trend</h3>
            <HRVTrendChart data={chartData} />
          </div>

          {/* Sleep Chart */}
          <div className="vitals-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Sleep Duration & Score</h3>
            <SleepChart data={chartData} />
          </div>

          {/* RHR Trend Chart */}
          <div className="vitals-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Resting Heart Rate Trend</h3>
            <RHRTrendChart data={chartData} />
          </div>

          {/* Recent Workouts Section */}
          {recentWorkouts.length > 0 && (
            <div className="vitals-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Workouts</h3>
              <div className="space-y-3">
                {recentWorkouts.map((workout, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: getWorkoutColor(workout.activityStrain) }}
                      >
                        <span className="text-white text-sm font-semibold">
                          {workout.activityStrain?.toFixed(1) ?? '-'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{workout.activityName}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(workout.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{workout.duration} min</p>
                      {workout.energyBurned && (
                        <p className="text-sm text-muted-foreground">{workout.energyBurned.toLocaleString()} cal</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="vitals-card p-6 text-center py-12">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No activity data</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Add a Whoop or activity CSV file to your /data folder to see your lifestyle metrics.
          </p>
        </div>
      )}
    </div>
  );
}
