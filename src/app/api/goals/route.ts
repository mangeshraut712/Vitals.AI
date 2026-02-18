import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { GoalPriority } from '@/lib/analysis/goals';
import { loggers } from '@/lib/logger';
import { validateGoalCreateRequest } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const USER_GOALS_FILE = path.join(process.cwd(), 'user-goals.json');
const globalForGoals = globalThis as unknown as {
  inMemoryGoals?: UserGoal[];
};

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

interface WriteUserGoalsResult {
  success: boolean;
  persisted: boolean;
}

function isReadOnlyFsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String(error.code) : '';
  return code === 'EROFS' || code === 'EPERM' || code === 'EACCES';
}

function readUserGoals(): UserGoal[] {
  try {
    let fileExists = false;
    try { fileExists = fs.existsSync(USER_GOALS_FILE); } catch { /* EPERM */ }
    if (!fileExists) {
      return globalForGoals.inMemoryGoals ?? [];
    }
    const content = fs.readFileSync(USER_GOALS_FILE, 'utf-8');
    return JSON.parse(content) as UserGoal[];
  } catch (error) {
    loggers.api.error('Goals API failed to read user goals', error);
    return globalForGoals.inMemoryGoals ?? [];
  }
}


function writeUserGoals(goals: UserGoal[]): WriteUserGoalsResult {
  try {
    fs.writeFileSync(USER_GOALS_FILE, JSON.stringify(goals, null, 2));
    globalForGoals.inMemoryGoals = goals;
    return { success: true, persisted: true };
  } catch (error) {
    if (isReadOnlyFsError(error)) {
      globalForGoals.inMemoryGoals = goals;
      loggers.api.warn('Goals API read-only filesystem detected, using in-memory fallback');
      return { success: true, persisted: false };
    }

    loggers.api.error('Goals API failed to write user goals', error);
    return { success: false, persisted: false };
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const goals = readUserGoals();
    return NextResponse.json({ success: true, goals });
  } catch (error) {
    loggers.api.error('Goals API GET error', error);
    return NextResponse.json(
      {
        success: true,
        goals: [],
        degraded: true,
        warning: 'goals-read-failed',
      }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const parsed = validateGoalCreateRequest(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid goal payload' }
      );
    }
    const body = parsed.data;

    // Create new goal
    const newGoal: UserGoal = {
      id: `user-goal-${Date.now()}`,
      title: body.title,
      description: body.description,
      priority: body.priority,
      category: body.category || 'Other',
      actionItems: body.actionItems,
      source: 'user',
      createdAt: new Date().toISOString(),
    };

    // Read existing goals and add new one
    const existingGoals = readUserGoals();
    existingGoals.push(newGoal);

    // Write back
    const result = writeUserGoals(existingGoals);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to save goal' }
      );
    }

    loggers.api.info('Goals API created goal', newGoal.id);

    return NextResponse.json({
      success: true,
      goal: newGoal,
      degraded: !result.persisted,
      warning: result.persisted ? undefined : 'goals-memory-only',
    });
  } catch (error) {
    loggers.api.error('Goals API POST error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create goal' }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('id');

    if (!goalId) {
      return NextResponse.json(
        { success: false, error: 'Goal ID required' }
      );
    }

    const existingGoals = readUserGoals();
    const filteredGoals = existingGoals.filter((g) => g.id !== goalId);

    if (filteredGoals.length === existingGoals.length) {
      return NextResponse.json(
        { success: true, deleted: false }
      );
    }

    const result = writeUserGoals(filteredGoals);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete goal' }
      );
    }

    loggers.api.info('Goals API deleted goal', goalId);

    return NextResponse.json({
      success: true,
      deleted: true,
      degraded: !result.persisted,
      warning: result.persisted ? undefined : 'goals-memory-only',
    });
  } catch (error) {
    loggers.api.error('Goals API DELETE error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete goal' }
    );
  }
}
