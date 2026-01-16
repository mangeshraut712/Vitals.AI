'use client';

import { useEffect, useState } from 'react';
import type { HealthScoreResult } from '@/lib/calculations/health-score';
import type { PhenoAgeResult } from '@/lib/calculations/phenoage';

interface HeroMetricsProps {
  healthScore: HealthScoreResult;
  chronologicalAge: number | null;
  phenoAge: PhenoAgeResult | null;
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-lime-600';
  if (score >= 55) return 'text-amber-600';
  return 'text-rose-600';
}

function getScoreRingColor(score: number): string {
  if (score >= 85) return '#059669'; // emerald-600
  if (score >= 70) return '#65a30d'; // lime-600
  if (score >= 55) return '#d97706'; // amber-600
  return '#dc2626'; // rose-600
}

export function HeroMetrics({
  healthScore,
  chronologicalAge,
  phenoAge,
}: HeroMetricsProps): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    setMounted(true);
    const duration = 1200;
    const steps = 60;
    const increment = healthScore.score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= healthScore.score) {
        setAnimatedScore(healthScore.score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [healthScore.score]);

  const hasAgeData = chronologicalAge !== null && phenoAge !== null;
  const delta = phenoAge?.delta ?? 0;
  const isYounger = delta < 0;

  const radius = 80;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const scoreColor = getScoreColor(healthScore.score);
  const ringColor = getScoreRingColor(healthScore.score);

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Health Score Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Health Score
            </h2>
            <p className="text-xs text-gray-400 mt-1">Based on your biomarkers</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              healthScore.score >= 70
                ? 'bg-emerald-50 text-emerald-700'
                : healthScore.score >= 55
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-rose-50 text-rose-700'
            }`}
          >
            {healthScore.label}
          </span>
        </div>

        <div className="flex items-center gap-8">
          {/* Score Ring */}
          <div className="relative flex-shrink-0">
            <svg
              height={radius * 2}
              width={radius * 2}
              className="-rotate-90"
            >
              <circle
                stroke="#f3f4f6"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke={ringColor}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference + ' ' + circumference}
                style={{
                  strokeDashoffset,
                  transition: 'stroke-dashoffset 1.2s ease-out',
                }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold tabular-nums ${scoreColor}`}>
                {animatedScore}
              </span>
              <span className="text-xs text-gray-400">of 100</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-600">Optimal</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {healthScore.breakdown.optimalCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm text-gray-600">Normal</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {healthScore.breakdown.normalCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-sm text-gray-600">Needs Attention</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {healthScore.breakdown.outOfRangeCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Biological Age Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Biological Age
            </h2>
            <p className="text-xs text-gray-400 mt-1">PhenoAge calculation</p>
          </div>
          {/* Explicit ternary for conditional rendering (Rule 6.7) */}
          {hasAgeData ? (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isYounger
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {isYounger ? 'Younger than actual' : 'Older than actual'}
            </span>
          ) : null}
        </div>

        {hasAgeData ? (
          <div className="flex items-center gap-8">
            {/* Bio Age Display */}
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 tabular-nums">
                {phenoAge.phenoAge.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                Bio Age
              </div>
            </div>

            {/* Delta */}
            <div
              className={`flex flex-col items-center px-4 py-2 rounded-xl ${
                isYounger ? 'bg-emerald-50' : 'bg-rose-50'
              }`}
            >
              <div
                className={`text-2xl font-bold flex items-center gap-1 ${
                  isYounger ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {isYounger ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {Math.abs(delta).toFixed(1)}
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">years</span>
            </div>

            {/* Actual Age */}
            <div className="text-center opacity-60">
              <div className="text-3xl font-medium text-gray-600 tabular-nums">
                {chronologicalAge}
              </div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                Actual
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm font-medium">Add blood work data</p>
            <p className="text-gray-400 text-xs mt-1">to calculate your biological age</p>
          </div>
        )}

        {hasAgeData ? (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {isYounger
                ? `Your body is aging ${Math.abs(delta).toFixed(1)} years slower than average`
                : `Your body is aging ${Math.abs(delta).toFixed(1)} years faster than average`}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
