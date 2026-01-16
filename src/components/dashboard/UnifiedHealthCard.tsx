'use client';

import { useEffect, useState } from 'react';
import type { PhenoAgeResult } from '@/lib/calculations/phenoage';
import type { Goal } from '@/lib/analysis/goals';

interface LifestyleMetrics {
  hrv: number | null;
  steps: number | null;
  sleepHours: number | null;
  recovery: number | null;
}

interface BodyCompMetrics {
  bodyFatPercent: number | null;
  muscleMass: number | null;
}

interface UnifiedHealthCardProps {
  chronologicalAge: number | null;
  phenoAge: PhenoAgeResult | null;
  lifestyleMetrics: LifestyleMetrics;
  bodyCompMetrics: BodyCompMetrics;
  goals: Goal[];
}

/**
 * Calculate health score from lifestyle and body composition metrics
 * Score is 0-100 based on:
 * - Activity: HRV, steps, recovery (40%)
 * - Sleep: hours per night (20%)
 * - Body Composition: body fat %, muscle mass (40%)
 */
function calculateHealthScore(
  lifestyle: LifestyleMetrics,
  bodyComp: BodyCompMetrics
): { score: number; hasData: boolean } {
  let totalWeight = 0;
  let weightedSum = 0;

  // HRV Score (0-100): 60+ excellent, 40-60 good, <40 needs work
  if (lifestyle.hrv !== null) {
    const hrvScore = lifestyle.hrv >= 60 ? 100 : lifestyle.hrv >= 50 ? 85 : lifestyle.hrv >= 40 ? 70 : lifestyle.hrv >= 30 ? 50 : 30;
    weightedSum += hrvScore * 15;
    totalWeight += 15;
  }

  // Steps Score: 10k+ excellent, 7-10k good, <7k needs work
  if (lifestyle.steps !== null) {
    const stepsScore = lifestyle.steps >= 10000 ? 100 : lifestyle.steps >= 8000 ? 85 : lifestyle.steps >= 6000 ? 70 : lifestyle.steps >= 4000 ? 50 : 30;
    weightedSum += stepsScore * 10;
    totalWeight += 10;
  }

  // Recovery Score: direct percentage
  if (lifestyle.recovery !== null) {
    weightedSum += lifestyle.recovery * 15;
    totalWeight += 15;
  }

  // Sleep Score: 7-9 hours optimal
  if (lifestyle.sleepHours !== null) {
    const sleepScore =
      (lifestyle.sleepHours >= 7 && lifestyle.sleepHours <= 9) ? 100 :
      (lifestyle.sleepHours >= 6 && lifestyle.sleepHours <= 10) ? 75 : 40;
    weightedSum += sleepScore * 20;
    totalWeight += 20;
  }

  // Body Fat Score (assuming male ranges, could be parameterized)
  // 10-20% excellent, 20-25% good, >25% needs attention
  if (bodyComp.bodyFatPercent !== null) {
    const bfScore =
      bodyComp.bodyFatPercent <= 15 ? 100 :
      bodyComp.bodyFatPercent <= 20 ? 85 :
      bodyComp.bodyFatPercent <= 25 ? 70 :
      bodyComp.bodyFatPercent <= 30 ? 50 : 30;
    weightedSum += bfScore * 25;
    totalWeight += 25;
  }

  // Muscle Mass Score (relative assessment)
  if (bodyComp.muscleMass !== null) {
    // Simplified: assume muscle mass in lbs, 140+ excellent for average male
    const mmScore =
      bodyComp.muscleMass >= 150 ? 100 :
      bodyComp.muscleMass >= 130 ? 85 :
      bodyComp.muscleMass >= 110 ? 70 : 50;
    weightedSum += mmScore * 15;
    totalWeight += 15;
  }

  if (totalWeight === 0) {
    return { score: 0, hasData: false };
  }

  return { score: Math.round(weightedSum / totalWeight), hasData: true };
}

function getScoreStatus(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 85) return { label: 'Excellent', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
  if (score >= 70) return { label: 'Good', color: 'text-sky-600', bgColor: 'bg-sky-50' };
  if (score >= 55) return { label: 'Fair', color: 'text-amber-600', bgColor: 'bg-amber-50' };
  return { label: 'Needs Work', color: 'text-rose-600', bgColor: 'bg-rose-50' };
}

function getAgeDeltaColor(delta: number): { color: string; bgColor: string } {
  if (delta <= -2) return { color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
  if (delta <= 2) return { color: 'text-sky-600', bgColor: 'bg-sky-50' };
  if (delta <= 5) return { color: 'text-amber-600', bgColor: 'bg-amber-50' };
  return { color: 'text-rose-600', bgColor: 'bg-rose-50' };
}

function ActionItem({ goal, index }: { goal: Goal; index: number }): React.JSX.Element {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), index * 80 + 300);
    return () => clearTimeout(timer);
  }, [index]);

  const priorityColors = {
    high: { dot: 'bg-rose-500', bg: 'hover:bg-rose-50/50' },
    medium: { dot: 'bg-amber-500', bg: 'hover:bg-amber-50/50' },
    low: { dot: 'bg-sky-500', bg: 'hover:bg-sky-50/50' },
  };

  const colors = priorityColors[goal.priority];

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer ${colors.bg} ${
        mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${colors.dot} mt-1.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-snug">{goal.title}</p>
        {goal.currentValue !== undefined && goal.targetValue && (
          <p className="text-xs text-gray-500 mt-0.5">
            {goal.currentValue} → {goal.targetValue}
          </p>
        )}
      </div>
      <svg
        className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

export function UnifiedHealthCard({
  chronologicalAge,
  phenoAge,
  lifestyleMetrics,
  bodyCompMetrics,
  goals,
}: UnifiedHealthCardProps): React.JSX.Element {
  const [mounted, setMounted] = useState(false);

  const hasAgeData = chronologicalAge !== null && phenoAge !== null;
  const delta = phenoAge?.delta ?? 0;
  const deltaColors = getAgeDeltaColor(delta);

  const { score: healthScore, hasData: hasHealthData } = calculateHealthScore(lifestyleMetrics, bodyCompMetrics);
  const scoreStatus = getScoreStatus(healthScore);

  const topGoals = goals.slice(0, 3);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* Left: Health Metrics (3 cols) */}
        <div className="lg:col-span-3 p-8 lg:border-r border-gray-100">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">
            Health Overview
          </h2>

          <div className="grid grid-cols-2 gap-8">
            {/* Biological Age */}
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bio Age</span>
                {hasAgeData && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${deltaColors.bgColor} ${deltaColors.color}`}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)} yrs
                  </span>
                )}
              </div>

              {hasAgeData ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-gray-900 tabular-nums tracking-tight">
                    {phenoAge.phenoAge.toFixed(1)}
                  </span>
                  <div className="text-gray-400">
                    <span className="text-sm">vs</span>
                    <span className="text-lg font-medium text-gray-500 ml-1">{chronologicalAge}</span>
                    <span className="text-sm ml-1">actual</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">
                  <span className="text-3xl font-medium">--</span>
                  <p className="text-xs mt-1">Sync blood work to calculate</p>
                </div>
              )}

              {hasAgeData && (
                <p className="text-sm text-gray-500 mt-3">
                  {delta < 0
                    ? `Your body is aging ${Math.abs(delta).toFixed(1)} years slower than average`
                    : delta > 2
                      ? `Your body is aging ${delta.toFixed(1)} years faster than average`
                      : 'Your biological age matches your calendar age'
                  }
                </p>
              )}
            </div>

            {/* Health Score */}
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Health Score</span>
                {hasHealthData && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${scoreStatus.bgColor} ${scoreStatus.color}`}>
                    {scoreStatus.label}
                  </span>
                )}
              </div>

              {hasHealthData ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-gray-900 tabular-nums tracking-tight">
                      {healthScore}
                    </span>
                    <span className="text-xl text-gray-400">/100</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Based on activity, sleep & body composition
                  </p>
                </>
              ) : (
                <div className="text-gray-400">
                  <span className="text-3xl font-medium">--</span>
                  <p className="text-xs mt-1">Sync activity & DEXA data</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Items (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Action Items</h3>
            {goals.length > 3 && (
              <span className="text-xs text-gray-500 font-medium">
                +{goals.length - 3} more
              </span>
            )}
          </div>

          {topGoals.length > 0 ? (
            <div className="space-y-2">
              {topGoals.map((goal, index) => (
                <ActionItem key={goal.id} goal={goal} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">All Clear!</p>
              <p className="text-xs text-gray-500 mt-1">No urgent actions needed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
