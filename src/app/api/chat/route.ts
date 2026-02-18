import { NextRequest, NextResponse } from 'next/server';
import { queryHealthAgentStream } from '@/lib/agent/health-agent';
import { HealthDataStore } from '@/lib/store/health-data';
import { loggers } from '@/lib/logger';
import { checkRateLimit } from '@/lib/security';
import { validateChatPromptRequest } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rateLimit = checkRateLimit(`chat:${clientIp}`, 40, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      );
    }

    const parsed = validateChatPromptRequest(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }
    const message = parsed.data.message;

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
    loggers.api.error('Chat API error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
