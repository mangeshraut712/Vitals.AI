'use client';

import { InsightCard, type InsightStatus } from '@/components/insights/InsightCard';
import { STATUS_COLORS } from '@/lib/design/tokens';
import type { ActivityData } from '@/lib/store/health-data';
import type { WhoopWorkout } from '@/lib/parsers/whoop';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

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
  const { avgHrv, avgRhr, avgSleep, avgSleepScore, avgStrain, avgRecovery } = averages;

  // Prepare chart data with formatted dates
  const chartData = activityData.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
  }));

  const hasData = activityData.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Lifestyle</h1>
        <p className="text-gray-500 mt-1">Your daily activity and recovery metrics</p>
      </header>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <InsightCard
          title="Recovery"
          value={avgRecovery}
          unit="%"
          status={getRecoveryStatus(avgRecovery)}
          subtitle="7-day average"
          actionItems={RECOVERY_TIPS}
        />
        <InsightCard
          title="HRV"
          value={avgHrv}
          unit="ms"
          status={getHrvStatus(avgHrv)}
          subtitle="7-day average"
          actionItems={HRV_TIPS}
        />
        <InsightCard
          title="Sleep Score"
          value={avgSleepScore}
          unit="%"
          status={getSleepStatus(avgSleepScore)}
          subtitle="7-day average"
          actionItems={SLEEP_TIPS}
        />
        <InsightCard
          title="Resting HR"
          value={avgRhr}
          unit="bpm"
          status={getRhrStatus(avgRhr)}
          subtitle="7-day average"
          actionItems={RHR_TIPS}
        />
        <InsightCard
          title="Strain"
          value={avgStrain}
          unit=""
          status={getStrainStatus(avgStrain)}
          subtitle="7-day average"
          actionItems={STRAIN_TIPS}
        />
      </div>

      {/* Charts Section */}
      {hasData ? (
        <div className="space-y-6">
          {/* HRV Trend Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">HRV Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${value ?? 0} ms`, 'HRV']}
                  />
                  <ReferenceLine
                    y={60}
                    stroke={STATUS_COLORS.optimal.base}
                    strokeDasharray="5 5"
                    label={{ value: 'Optimal', fill: STATUS_COLORS.optimal.base, fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hrv"
                    stroke={STATUS_COLORS.optimal.base}
                    strokeWidth={2}
                    dot={{ fill: STATUS_COLORS.optimal.base, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sleep Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sleep Duration & Score</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 10]}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    label={{ value: 'Score', angle: 90, position: 'insideRight', fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value, name) => {
                      if (name === 'sleepHours') return [`${value ?? 0} hrs`, 'Sleep'];
                      return [`${value ?? 0}%`, 'Score'];
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="sleepHours"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    name="sleepHours"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="sleepScore"
                    stroke={STATUS_COLORS.optimal.base}
                    strokeWidth={2}
                    dot={{ fill: STATUS_COLORS.optimal.base, strokeWidth: 2, r: 3 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RHR Trend Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resting Heart Rate Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${value ?? 0} bpm`, 'RHR']}
                  />
                  <ReferenceLine
                    y={55}
                    stroke={STATUS_COLORS.optimal.base}
                    strokeDasharray="5 5"
                    label={{ value: 'Optimal', fill: STATUS_COLORS.optimal.base, fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rhr"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Workouts Section */}
          {recentWorkouts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Workouts</h3>
              <div className="space-y-3">
                {recentWorkouts.map((workout, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
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
                        <p className="font-medium text-gray-900">{workout.activityName}</p>
                        <p className="text-sm text-gray-500">{formatDate(workout.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{workout.duration} min</p>
                      {workout.energyBurned && (
                        <p className="text-sm text-gray-500">{workout.energyBurned.toLocaleString()} cal</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center py-12">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gray-100">
            <svg
              className="w-8 h-8 text-gray-400"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity data</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Add a Whoop or activity CSV file to your /data folder to see your lifestyle metrics.
          </p>
        </div>
      )}
    </div>
  );
}
