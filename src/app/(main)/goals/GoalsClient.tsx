'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoalCard } from '@/components/goals/GoalCard';
import { CreateGoalPanel } from '@/components/goals/CreateGoalPanel';
import { Button } from '@/components/ui/button';
import { Plus, Target } from 'lucide-react';
import type { Goal } from '@/lib/analysis/goals';
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

  const handleGoalCreated = (): void => {
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
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header with +Create button */}
      <header className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                <Target className="h-4.5 w-4.5 text-foreground" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Plan Center
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Goals</h1>
            <p className="text-muted-foreground mt-1">
              Personalized priorities generated from biomarkers, body composition, and recovery.
            </p>
          </div>
          <Button
            onClick={() => setIsPanelOpen(true)}
            className="vitals-gradient-bg text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create Goal
          </Button>
        </div>
      </header>

      {/* Empty state */}
      {hasNoGoals && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 text-center py-12">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-50">
            <svg
              className="w-8 h-8 text-emerald-600"
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
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No goals - your health looks great!
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
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
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
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
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
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
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
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
