'use client';

import { useState } from 'react';
import { GRADIENTS, RADIUS, SHADOWS } from '@/lib/design/tokens';
import type { Goal, GoalPriority } from '@/lib/analysis/goals';

interface GoalCardProps {
  goal: Goal;
  compact?: boolean;
}

function getGradient(priority: GoalPriority): string {
  switch (priority) {
    case 'high':
      return GRADIENTS.high;
    case 'medium':
      return GRADIENTS.medium;
    case 'low':
      return GRADIENTS.low;
  }
}

function getPriorityLabel(priority: GoalPriority): string {
  switch (priority) {
    case 'high':
      return 'High Priority';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Optimization';
  }
}

export function GoalCard({ goal, compact = false }: GoalCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const gradient = getGradient(goal.priority);

  if (compact) {
    return (
      <div
        className="p-4 text-white relative overflow-hidden"
        style={{
          background: gradient,
          borderRadius: RADIUS.lg,
          boxShadow: SHADOWS.md,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{goal.title}</h3>
            <p className="text-white/70 text-xs mt-1 line-clamp-1">{goal.category}</p>
          </div>
          <span className="text-xs bg-card/20 px-2 py-0.5 rounded-full whitespace-nowrap">
            {getPriorityLabel(goal.priority)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 text-white relative overflow-hidden"
      style={{
        background: gradient,
        borderRadius: RADIUS.xl,
        boxShadow: SHADOWS.lg,
      }}
    >
      {/* Priority badge */}
      <span className="absolute top-4 right-4 text-xs bg-card/20 px-3 py-1 rounded-full">
        {getPriorityLabel(goal.priority)}
      </span>

      {/* Title and description */}
      <div className="pr-24">
        <span className="text-xs text-white/70 uppercase tracking-wide">{goal.category}</span>
        <h3 className="text-xl font-semibold mt-1 leading-tight">{goal.title}</h3>
        <p className="text-white/80 text-sm mt-2 leading-relaxed">{goal.description}</p>
      </div>

      {/* Current value if available */}
      {goal.currentValue !== undefined && goal.targetValue && (
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div>
            <span className="text-white/60">Current:</span>
            <span className="ml-2 font-medium">{goal.currentValue}</span>
          </div>
          <div>
            <span className="text-white/60">Target:</span>
            <span className="ml-2 font-medium">{goal.targetValue}</span>
          </div>
        </div>
      )}

      {/* Expand/collapse button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 flex items-center gap-1 text-sm text-white/90 hover:text-white transition-colors"
      >
        <span>{expanded ? 'Hide action plan' : 'How to solve this'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Action items */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <h4 className="text-sm font-medium mb-3">Action Plan</h4>
          <ul className="space-y-2">
            {goal.actionItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-white/90">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-card/60 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
