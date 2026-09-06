import type { GoalPriority } from '@/lib/analysis/goals';

export interface UserGoal {
  id: string;
  title: string;
  description: string;
  priority: GoalPriority;
  category: string;
  actionItems: string[];
  source: 'user';
  createdAt: string;
}
