import { NextResponse, NextRequest } from 'next/server';
import { queryGoalAgent, type GoalAgentResponse } from '@/lib/agent/goal-agent';
import { HealthDataStore } from '@/lib/store/health-data';

interface ChatRequest {
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
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
    const healthContext = HealthDataStore.getHealthSummary();

    // Query the goal agent
    const response: GoalAgentResponse = await queryGoalAgent(
      body.message,
      healthContext,
      body.conversationHistory || []
    );

    if (response.error) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 500 }
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
      { success: false, error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
