import { NextResponse, NextRequest } from 'next/server';
import { queryGoalAgent, type GoalAgentResponse } from '@/lib/agent/goal-agent';
import { HealthDataStore } from '@/lib/store/health-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ChatRequest {
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function fallbackGoalChatMessage(message: string): string {
  return `I can still help draft a goal even while the AI service is unavailable. Based on "${message}", start with a small weekly target, track it daily, and adjust after 14 days.`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get health context for the AI
    const healthContext = await HealthDataStore.getHealthSummary();

    // Query the goal agent
    const response: GoalAgentResponse = await queryGoalAgent(
      body.message,
      healthContext,
      body.conversationHistory || []
    );

    if (response.error) {
      console.warn('[Goal Chat API] Returning degraded goal response:', response.error);
      return NextResponse.json(
        {
          success: true,
          content: response.content || fallbackGoalChatMessage(body.message),
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
        content: fallbackGoalChatMessage('your goal request'),
        degraded: true,
        warning: 'goal-chat-exception',
      }
    );
  }
}
