'use client';

import { InsightCard, type InsightStatus } from '@/components/insights/InsightCard';
import { CARD_CLASSES, STATUS_COLORS } from '@/lib/design/tokens';
import type { BodyComposition } from '@/lib/extractors/body-comp';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

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

export function BodyCompClient({ bodyComp }: BodyCompClientProps): React.JSX.Element {
  const {
    bodyFatPercent = 0,
    leanMass = 0,
    fatMass = 0,
    visceralFat = 0,
    almi = 0,
    boneMineralContent = 0,
  } = bodyComp;

  const hasData = bodyFatPercent > 0 || leanMass > 0;
  const totalMass = leanMass + fatMass + boneMineralContent;

  // Bar chart data - composition breakdown
  const compositionData = [
    { name: 'Lean Mass', value: leanMass, color: CHART_COLORS.lean },
    { name: 'Fat Mass', value: fatMass, color: CHART_COLORS.fat },
    { name: 'Bone', value: boneMineralContent, color: CHART_COLORS.bone },
  ].filter((d) => d.value > 0);

  // Pie chart data - fat vs lean
  const pieData = [
    { name: 'Lean', value: leanMass + boneMineralContent, color: CHART_COLORS.lean },
    { name: 'Fat', value: fatMass, color: CHART_COLORS.fat },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Body Composition</h1>
        <p className="text-slate-500 mt-1">Your DEXA scan analysis and body metrics</p>
      </header>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightCard
          title="Body Fat"
          value={bodyFatPercent.toFixed(1)}
          unit="%"
          status={getBodyFatStatus(bodyFatPercent)}
          subtitle="Total body fat percentage"
          actionItems={BODY_FAT_TIPS}
        />
        <InsightCard
          title="Lean Mass"
          value={leanMass.toFixed(1)}
          unit="lbs"
          status={getLeanMassStatus(leanMass, bodyFatPercent)}
          subtitle="Muscle and organ tissue"
          actionItems={LEAN_MASS_TIPS}
        />
        <InsightCard
          title="Visceral Fat"
          value={visceralFat.toFixed(1)}
          unit="lbs"
          status={getVisceralFatStatus(visceralFat)}
          subtitle="Internal organ fat"
          actionItems={VISCERAL_FAT_TIPS}
        />
        <InsightCard
          title="ALMI"
          value={almi.toFixed(2)}
          unit="kg/m²"
          status={getAlmiStatus(almi)}
          subtitle="Appendicular lean mass index"
          actionItems={ALMI_TIPS}
        />
      </div>

      {/* Charts Section */}
      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Body Composition Breakdown */}
          <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding}`}>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Composition Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={compositionData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, bottom: 5, left: 80 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 'auto']}
                    tickFormatter={(v) => `${v} lbs`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${value} lbs`, '']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    {compositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {totalMass > 0 && (
              <p className="text-sm text-slate-500 mt-2 text-center">
                Total: {totalMass.toFixed(1)} lbs
              </p>
            )}
          </div>

          {/* Fat vs Lean Distribution */}
          <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding}`}>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Fat vs Lean Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${value} lbs`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS.lean }}
                />
                <span className="text-sm text-slate-600">Lean Mass</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS.fat }}
                />
                <span className="text-sm text-slate-600">Fat Mass</span>
              </div>
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No body composition data</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Add a DEXA scan file to your /data folder to see your body composition analysis.
          </p>
        </div>
      )}
    </div>
  );
}
