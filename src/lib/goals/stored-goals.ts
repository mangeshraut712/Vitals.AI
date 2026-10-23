import type { UserGoal } from '@/lib/types/user-goal';

const GOAL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const PRIORITIES = new Set(['high', 'medium', 'low']);

export function isValidGoalId(id: string): boolean {
  return GOAL_ID_PATTERN.test(id);
}

function isUserGoal(value: unknown): value is UserGoal {
  if (!value || typeof value !== 'object') return false;
  const goal = value as Partial<UserGoal>;
  return (
    typeof goal.id === 'string' &&
    isValidGoalId(goal.id) &&
    typeof goal.title === 'string' &&
    typeof goal.description === 'string' &&
    typeof goal.priority === 'string' &&
    PRIORITIES.has(goal.priority) &&
    typeof goal.category === 'string' &&
    Array.isArray(goal.actionItems) &&
    goal.actionItems.every((item) => typeof item === 'string') &&
    goal.source === 'user' &&
    typeof goal.createdAt === 'string'
  );
}

export function parseStoredGoals(content: string): UserGoal[] {
  try {
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isUserGoal);
  } catch {
    return [];
  }
}
