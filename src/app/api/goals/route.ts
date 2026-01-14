import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { GoalPriority } from '@/lib/analysis/goals';

const USER_GOALS_FILE = path.join(process.cwd(), 'data', 'user-goals.json');

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

interface GoalCreateRequest {
  title: string;
  description: string;
  priority: GoalPriority;
  category: string;
  actionItems: string[];
}

function readUserGoals(): UserGoal[] {
  try {
    if (!fs.existsSync(USER_GOALS_FILE)) {
      return [];
    }
    const content = fs.readFileSync(USER_GOALS_FILE, 'utf-8');
    return JSON.parse(content) as UserGoal[];
  } catch (error) {
    console.error('[Goals API] Failed to read user goals:', error);
    return [];
  }
}

function writeUserGoals(goals: UserGoal[]): boolean {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(USER_GOALS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(USER_GOALS_FILE, JSON.stringify(goals, null, 2));
    return true;
  } catch (error) {
    console.error('[Goals API] Failed to write user goals:', error);
    return false;
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const goals = readUserGoals();
    return NextResponse.json({ success: true, goals });
  } catch (error) {
    console.error('[Goals API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as GoalCreateRequest;

    // Validate required fields
    if (!body.title || !body.description || !body.priority || !body.actionItems) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate priority
    if (!['high', 'medium', 'low'].includes(body.priority)) {
      return NextResponse.json(
        { success: false, error: 'Invalid priority value' },
        { status: 400 }
      );
    }

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
    const success = writeUserGoals(existingGoals);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to save goal' },
        { status: 500 }
      );
    }

    console.log('[Goals API] Created new user goal:', newGoal.id);

    return NextResponse.json({ success: true, goal: newGoal });
  } catch (error) {
    console.error('[Goals API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('id');

    if (!goalId) {
      return NextResponse.json(
        { success: false, error: 'Goal ID required' },
        { status: 400 }
      );
    }

    const existingGoals = readUserGoals();
    const filteredGoals = existingGoals.filter((g) => g.id !== goalId);

    if (filteredGoals.length === existingGoals.length) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    const success = writeUserGoals(filteredGoals);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete goal' },
        { status: 500 }
      );
    }

    console.log('[Goals API] Deleted user goal:', goalId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Goals API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
