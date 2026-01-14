'use client';

import { InsightCard, type InsightStatus } from '@/components/insights/InsightCard';
import { CARD_CLASSES, STATUS_COLORS } from '@/lib/design/tokens';
import type { ActivityData } from '@/lib/store/health-data';
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
  };
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function LifestyleClient({
  activityData,
  averages,
}: LifestyleClientProps): React.JSX.Element {
  const { avgHrv, avgRhr, avgSleep, avgSleepScore, avgStrain } = averages;

  // Prepare chart data with formatted dates
  const chartData = activityData.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
  }));

  const hasData = activityData.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Lifestyle</h1>
        <p className="text-slate-500 mt-1">Your daily activity and recovery metrics</p>
      </header>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding}`}>
            <h3 className="text-lg font-medium text-slate-900 mb-4">HRV Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
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
          <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding}`}>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Sleep Duration & Score</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 10]}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    label={{ value: 'Score', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
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
          <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding}`}>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Resting Heart Rate Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
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
        </div>
      ) : (
        <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding} text-center py-12`}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-slate-100">
            <svg
              className="w-8 h-8 text-slate-400"
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
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No activity data</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Add a Whoop or activity CSV file to your /data folder to see your lifestyle metrics.
          </p>
        </div>
      )}
    </div>
  );
}
