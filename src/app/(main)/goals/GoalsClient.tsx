'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoalCard } from '@/components/goals/GoalCard';
import { CreateGoalPanel } from '@/components/goals/CreateGoalPanel';
import { Button } from '@/components/ui/button';
import { CARD_CLASSES, STATUS_COLORS } from '@/lib/design/tokens';
import type { Goal } from '@/lib/analysis/goals';
import type { GoalProposal } from '@/lib/agent/goal-agent';
import type { UserGoal } from '@/app/api/goals/route';

interface GoalsClientProps {
  autoGoals: Goal[];
}

interface UserGoalsResponse {
  success: boolean;
  goals: UserGoal[];
  error?: string;
}

// Convert UserGoal to Goal format for display
function userGoalToGoal(userGoal: UserGoal): Goal {
  return {
    id: userGoal.id,
    title: userGoal.title,
    description: userGoal.description,
    priority: userGoal.priority,
    category: userGoal.category,
    actionItems: userGoal.actionItems,
  };
}

export function GoalsClient({ autoGoals }: GoalsClientProps): React.JSX.Element {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [userGoals, setUserGoals] = useState<Goal[]>([]);
  const [isLoadingUserGoals, setIsLoadingUserGoals] = useState(true);

  // Fetch user goals on mount
  const fetchUserGoals = useCallback(async () => {
    try {
      const response = await fetch('/api/goals');
      const data = (await response.json()) as UserGoalsResponse;

      if (data.success && data.goals) {
        setUserGoals(data.goals.map(userGoalToGoal));
      }
    } catch (error) {
      console.error('[GoalsClient] Failed to fetch user goals:', error);
    } finally {
      setIsLoadingUserGoals(false);
    }
  }, []);

  useEffect(() => {
    fetchUserGoals();
  }, [fetchUserGoals]);

  const handleGoalCreated = (_proposal: GoalProposal): void => {
    // Refetch user goals to get the newly created one
    fetchUserGoals();
  };

  // Combine auto-generated and user goals
  const allGoals = [...autoGoals, ...userGoals];

  // Group by priority
  const highPriority = allGoals.filter((g) => g.priority === 'high');
  const mediumPriority = allGoals.filter((g) => g.priority === 'medium');
  const lowPriority = allGoals.filter((g) => g.priority === 'low');

  const hasNoGoals = allGoals.length === 0 && !isLoadingUserGoals;

  return (
    <div className="space-y-6">
      {/* Header with +Create button */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Goals</h1>
          <p className="text-slate-500 mt-1">Your personalized health improvement goals</p>
        </div>
        <Button
          onClick={() => setIsPanelOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Goal
        </Button>
      </header>

      {/* Empty state */}
      {hasNoGoals && (
        <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding} text-center py-12`}>
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: STATUS_COLORS.optimal.light }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: STATUS_COLORS.optimal.base }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No goals - your health looks great!
          </h3>
          <p className="text-slate-500 max-w-md mx-auto mb-4">
            All your biomarkers are in optimal or normal ranges. Keep up the good work!
          </p>
          <Button
            onClick={() => setIsPanelOpen(true)}
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            Create a personal goal
          </Button>
        </div>
      )}

      {/* Goals list */}
      {!hasNoGoals && (
        <div className="space-y-8">
          {highPriority.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                High Priority
              </h2>
              <div className="space-y-4">
                {highPriority.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          )}

          {mediumPriority.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Medium Priority
              </h2>
              <div className="space-y-4">
                {mediumPriority.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          )}

          {lowPriority.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Optimization Opportunities
              </h2>
              <div className="space-y-4">
                {lowPriority.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Create Goal Panel */}
      <CreateGoalPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onGoalCreated={handleGoalCreated}
      />
    </div>
  );
}
