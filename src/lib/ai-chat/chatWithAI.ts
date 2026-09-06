/**
 * Chat with AI — client stream of /api/chat, with a local tool demo fallback
 * for GitHub Pages (no API routes).
 */

import { withBasePath, isGitHubPagesExport } from '@/lib/runtime/paths';
import { parseSseDataLine, type AgentStreamEvent } from '@/lib/agent/agent-events';
import { runDeterministicAgentTurn } from '@/lib/agent/deterministic-runtime';
import { DEMO_HEALTH_SNAPSHOT } from '@/lib/agent/demo-snapshot';

export interface ChatResponse {
  response: string;
  error?: string;
}

async function* runDemoStream(message: string): AsyncGenerator<AgentStreamEvent, void, unknown> {
  const queued: AgentStreamEvent[] = [];
  await runDeterministicAgentTurn({
    message,
    snapshot: DEMO_HEALTH_SNAPSHOT,
    mode: 'demo',
    onEvent: (event) => {
      queued.push(event);
    },
  });
  for (const event of queued) {
    yield event;
  }
}

export async function* streamChatEvents(
  message: string
): AsyncGenerator<AgentStreamEvent, void, unknown> {
  if (isGitHubPagesExport()) {
    yield* runDemoStream(message);
    return;
  }

  try {
    const response = await fetch(withBasePath('/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (response.status === 404) {
      yield* runDemoStream(message);
      return;
    }

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { error?: string };
      yield {
        type: 'error',
        message: errorData.error ?? 'Sorry, I encountered an error. Please try again.',
      };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: 'error', message: 'Empty response from the health agent.' };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let received = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const event = parseSseDataLine(line);
        if (!event) continue;
        received = true;
        yield event;
      }
    }

    if (!received) {
      yield { type: 'error', message: 'Sorry, I could not generate a response. Please try again.' };
    }
  } catch {
    yield* runDemoStream(message);
  }
}

export async function* streamChatWithAI(
  message: string
): AsyncGenerator<string, void, unknown> {
  for await (const event of streamChatEvents(message)) {
    if (event.type === 'text') yield event.text;
    if (event.type === 'error') yield event.message;
  }
}

export async function chatWithAI(message: string): Promise<ChatResponse> {
  try {
    let fullResponse = '';
    for await (const chunk of streamChatWithAI(message)) {
      fullResponse += chunk;
    }
    return { response: fullResponse };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to connect to AI';
    return {
      response: '',
      error: errorMessage,
    };
  }
}

export default chatWithAI;
