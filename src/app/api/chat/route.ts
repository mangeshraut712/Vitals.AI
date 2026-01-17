import { NextRequest, NextResponse } from 'next/server';
import { queryHealthAgent } from '@/lib/agent/health-agent';
import { HealthDataStore } from '@/lib/store/health-data';

interface ChatRequest {
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedMessage = body.message.trim();
    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    // Get health context from data store
    const healthContext = await HealthDataStore.getHealthSummary();

    // Query the health agent
    const result = await queryHealthAgent(trimmedMessage, healthContext);

    if (result.error) {
      console.error('[Vitals.AI] Agent error:', result.error);
      return NextResponse.json(
        { error: 'Failed to get response from health agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: result.content });
  } catch (error) {
    console.error('[Vitals.AI] API error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
