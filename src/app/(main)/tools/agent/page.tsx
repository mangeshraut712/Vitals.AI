'use client';

import { useState } from 'react';
import { streamChatWithAI } from '@/lib/ai-chat/chatWithAI';

export default function AgentPage(): React.JSX.Element {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      let assistantContent = '';
      let receivedAnyChunk = false;

      for await (const chunk of streamChatWithAI(userMessage)) {
        receivedAnyChunk = true;
        assistantContent += chunk;

        setMessages((prev) => {
          const next = [...prev];
          if (next.length > 0 && next[next.length - 1]?.role === 'assistant') {
            next[next.length - 1] = { role: 'assistant', content: assistantContent };
          }
          return next;
        });
      }

      if (!receivedAnyChunk) {
        setMessages((prev) => {
          const next = [...prev];
          if (next.length > 0 && next[next.length - 1]?.role === 'assistant') {
            next[next.length - 1] = {
              role: 'assistant',
              content: 'Sorry, I could not generate a response. Please try again.',
            };
          }
          return next;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 h-[calc(100vh-6rem)] flex flex-col">
      <header className="mb-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Health Agent</h1>
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
            Beta
          </span>
        </div>
        <p className="text-muted-foreground mt-1">
          Ask questions about your health data and get AI-powered insights
        </p>
      </header>

      {/* Chat Container */}
      <div className="flex-1 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100">
                  <svg
                    className="w-8 h-8 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Your Personal Health Assistant
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  I have access to your health data including biomarkers, body composition,
                  and lifestyle metrics. Ask me anything!
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-sm">
                  <button
                    onClick={() => setInput('What are my key health insights?')}
                    className="px-3 py-1.5 bg-muted hover:bg-muted rounded-lg text-foreground transition-colors"
                  >
                    Key insights
                  </button>
                  <button
                    onClick={() => setInput('How can I improve my biological age?')}
                    className="px-3 py-1.5 bg-muted hover:bg-muted rounded-lg text-foreground transition-colors"
                  >
                    Improve biological age
                  </button>
                  <button
                    onClick={() => setInput('Analyze my sleep patterns')}
                    className="px-3 py-1.5 bg-muted hover:bg-muted rounded-lg text-foreground transition-colors"
                  >
                    Sleep analysis
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="border-t border-border p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your health data..."
              className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
