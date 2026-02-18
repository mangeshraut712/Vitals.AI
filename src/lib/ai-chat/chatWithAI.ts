/**
 * Chat with AI - Client-side function to send messages to the health AI
 *
 * Sends message to /api/chat endpoint which calls OpenRouter
 * through Vercel AI SDK with the user's health data context.
 */

export interface ChatResponse {
  response: string;
  error?: string;
}

/**
 * Send a message to the health AI and get a response
 *
 * @param message - The user's message/question
 * @returns Promise with the AI's response or error
 */
export async function chatWithAI(message: string): Promise<ChatResponse> {
  try {
    let fullResponse = '';
    for await (const chunk of streamChatWithAI(message)) {
      fullResponse += chunk;
    }
    return { response: fullResponse };
  } catch (error) {
    // Network or parsing error
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to connect to AI';
    return {
      response: '',
      error: errorMessage,
    };
  }
}

/**
 * Stream a chat response from the AI
 *
 * API returns Server-Sent Events (SSE).
 */
export async function* streamChatWithAI(
  message: string
): AsyncGenerator<string, void, unknown> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { error?: string };
      yield errorData.error ?? 'Sorry, I encountered an error. Please try again.';
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) yield data.text;
          } catch (e) {
            console.warn('Failed to parse stream chunk', e);
          }
        }
      }
    }
  } catch {
    yield 'Failed to connect to the AI assistant.';
  }
}

export default chatWithAI;
