import { NextRequest, NextResponse } from 'next/server';
import { queryHealthAgentStream } from '@/lib/agent/health-agent';
import { HealthDataStore } from '@/lib/store/health-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const message = body.message;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const healthContext = await HealthDataStore.getHealthSummary();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let sentChunk = false;
          const result = await queryHealthAgentStream(message, healthContext, (chunk) => {
            sentChunk = true;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          });

          // If no chunks were streamed (e.g. provider error), send the final fallback message.
          if (!sentChunk && result.content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: result.content })}\n\n`));
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Vitals.AI] Chat API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
