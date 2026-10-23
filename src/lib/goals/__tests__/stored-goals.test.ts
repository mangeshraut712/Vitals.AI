import { describe, expect, it } from 'vitest';
import { isValidGoalId, parseStoredGoals } from '../stored-goals';
import { validateGoalChatRequest } from '@/lib/validation';

describe('stored goals', () => {
  it('ignores corrupt files and entries that are not goals', () => {
    expect(parseStoredGoals('{"not":"an array"}')).toEqual([]);
    expect(parseStoredGoals('not json')).toEqual([]);
    expect(parseStoredGoals(JSON.stringify([
      {
        id: '../etc/passwd',
        title: 'Bad',
        description: 'Bad',
        priority: 'high',
        category: 'Other',
        actionItems: ['x'],
        source: 'user',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'user-goal-1',
        title: 'Walk',
        description: 'Daily',
        priority: 'medium',
        category: 'Activity',
        actionItems: ['Walk 20 minutes'],
        source: 'user',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]))).toHaveLength(1);
  });

  it('accepts generated goal ids and rejects empty ones', () => {
    expect(isValidGoalId('user-goal-1710000000000')).toBe(true);
    expect(isValidGoalId('')).toBe(false);
    expect(isValidGoalId('../secret')).toBe(false);
  });
});

describe('goal chat validation', () => {
  it('rejects oversized histories and missing messages', () => {
    expect(validateGoalChatRequest({ message: '   ' }).success).toBe(false);
    expect(validateGoalChatRequest({
      message: 'Help me sleep',
      conversationHistory: Array.from({ length: 21 }, () => ({ role: 'user', content: 'again' })),
    }).success).toBe(false);
    const parsed = validateGoalChatRequest({ message: 'Help me sleep' });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.conversationHistory).toEqual([]);
  });
});
