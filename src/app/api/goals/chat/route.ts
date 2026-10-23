import { NextResponse, NextRequest } from 'next/server';
import { queryGoalAgent, type GoalAgentResponse } from '@/lib/agent/goal-agent';
import { HealthDataStore } from '@/lib/store/health-data';
import { validateGoalChatRequest } from '@/lib/validation';
import { checkRateLimit } from '@/lib/security';
import { clientRateLimitKey } from '@/lib/security/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function fallbackGoalChatMessage(): string {
  return 'I can still help draft a goal even while the AI service is unavailable. Start with a small weekly target, track it daily, and adjust after 14 days.';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateLimit = checkRateLimit(clientRateLimitKey(request, 'goal-chat'), 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const parsed = validateGoalChatRequest(payload);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const healthContext = await HealthDataStore.getHealthSummary();
    const response: GoalAgentResponse = await queryGoalAgent(
      parsed.data.message,
      healthContext,
      parsed.data.conversationHistory
    );

    if (response.error) {
      console.warn('[Goal Chat API] Returning degraded goal response:', response.error);
      return NextResponse.json(
        {
          success: true,
          content: response.content || fallbackGoalChatMessage(),
          proposal: response.proposal,
          degraded: true,
          warning: 'goal-agent-unavailable',
        }
      );
    }

    return NextResponse.json({
      success: true,
      content: response.content,
      proposal: response.proposal,
    });
  } catch (error) {
    console.error('[Goal Chat API] Error:', error);
    return NextResponse.json(
      {
        success: true,
        content: fallbackGoalChatMessage(),
        degraded: true,
        warning: 'goal-chat-exception',
      }
    );
  }
}
