import { NextRequest } from 'next/server';
import { queryHealthAgentStream } from '@/lib/agent/health-agent';
import { HealthDataStore } from '@/lib/store/health-data';
import { requestFastApiChat } from '@/lib/integrations/fastapi';
import { loggers } from '@/lib/logger';
import { checkRateLimit } from '@/lib/security';
import { validateChatPromptRequest } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function streamSingleMessage(message: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: message })}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function buildFastApiProxyResponse(
  message: string,
  healthContext: string
): Promise<Response | null> {
  const proxyResponse = await requestFastApiChat(message, healthContext);
  if (!proxyResponse) {
    return null;
  }

  if (!proxyResponse.ok) {
    const detail = await proxyResponse.text().catch(() => '');
    const errorDetail = detail ? detail.slice(0, 240) : `FastAPI returned ${proxyResponse.status}`;
    throw new Error(errorDetail);
  }

  const contentType = proxyResponse.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('text/event-stream')) {
    return new Response(proxyResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  if (contentType.includes('application/json')) {
    const payload = (await proxyResponse.json().catch(() => ({}))) as {
      content?: string;
      text?: string;
      response?: string;
      message?: string;
    };
    const text =
      payload.content?.trim() ||
      payload.text?.trim() ||
      payload.response?.trim() ||
      payload.message?.trim() ||
      'FastAPI request completed.';
    return streamSingleMessage(text);
  }

  const fallbackText = (await proxyResponse.text().catch(() => '')).trim();
  return streamSingleMessage(fallbackText || 'FastAPI request completed.');
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rateLimit = checkRateLimit(`chat:${clientIp}`, 40, 60_000);
    if (!rateLimit.allowed) {
      return streamSingleMessage(
        'Too many requests right now. Please try again in a minute.'
      );
    }

    const parsed = validateChatPromptRequest(await request.json());
    if (!parsed.success) {
      return streamSingleMessage('Invalid request payload.');
    }
    const message = parsed.data.message;

    const healthContext = await HealthDataStore.getHealthSummary();
    try {
      const fastApiResponse = await buildFastApiProxyResponse(message, healthContext);
      if (fastApiResponse) {
        return fastApiResponse;
      }
    } catch (error) {
      loggers.api.warn('FastAPI chat proxy failed; falling back to direct OpenRouter mode', error);
    }

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
    return streamSingleMessage('Internal Server Error');
  }
}
