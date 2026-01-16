'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Goal, GoalPriority } from '@/lib/analysis/goals';

interface GoalsSectionProps {
  goals: Goal[];
}

function getPriorityConfig(priority: GoalPriority): {
  label: string;
  bg: string;
  border: string;
  text: string;
  icon: React.ReactNode;
} {
  switch (priority) {
    case 'high':
      return {
        label: 'High Priority',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
      };
    case 'medium':
      return {
        label: 'Medium',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
      };
    case 'low':
      return {
        label: 'Optimization',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ),
      };
  }
}

function GoalItem({ goal, index }: { goal: Goal; index: number }): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  const config = getPriorityConfig(goal.priority);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), index * 100 + 400);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 transition-all duration-500 hover:shadow-md hover:border-gray-300 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Priority indicator */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg} ${config.text} mb-3`}>
        {config.icon}
        <span className="text-xs font-medium">{config.label}</span>
      </div>

      {/* Goal content */}
      <h3 className="text-gray-900 font-semibold leading-snug line-clamp-2 mb-2">{goal.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2">{goal.description}</p>

      {/* Current/Target if available */}
      {goal.currentValue !== undefined && goal.targetValue && (
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Current</span>
            <span className="text-sm font-medium text-gray-900">{goal.currentValue}</span>
          </div>
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Target</span>
            <span className="text-sm font-medium text-emerald-600">{goal.targetValue}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function GoalsSection({ goals }: GoalsSectionProps): React.JSX.Element {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const topGoals = goals.slice(0, 3);

  return (
    <div
      className={`transition-all duration-700 delay-500 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Action Items</h2>
        {goals.length > 0 && (
          <Link
            href="/goals"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            View all {goals.length} goals →
          </Link>
        )}
      </div>

      {topGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topGoals.map((goal, index) => (
            <GoalItem key={goal.id} goal={goal} index={index} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-gray-900 font-semibold mb-1">All Clear!</h3>
          <p className="text-sm text-gray-500">Your biomarkers are looking great. Keep it up!</p>
        </div>
      )}
    </div>
  );
}
