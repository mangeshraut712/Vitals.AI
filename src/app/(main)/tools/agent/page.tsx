'use client';

import { useState } from 'react';
import { Bot, SendHorizonal, Sparkles, Activity, CheckCircle2, AlertTriangle, XCircle, RotateCw } from 'lucide-react';
import { streamChatWithAI } from '@/lib/ai-chat/chatWithAI';

interface DiagnosticResult {
  status: 'ok' | 'error' | 'warning' | 'pending';
  message: string;
  latency: number;
}

interface DiagnosticsData {
  openRouter: DiagnosticResult;
  openClaw: DiagnosticResult;
}

function DiagnosticButton() {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setIsOpen(true);
    try {
      const res = await fetch('/api/agent/diagnostics');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !loading && !data) {
    return (
      <button
        onClick={runDiagnostics}
        className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <Activity className="h-3.5 w-3.5" />
        Status Check
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-card/50 px-3 py-1 backdrop-blur-sm">
      <button
        onClick={runDiagnostics}
        className={`rounded-full p-1 text-muted-foreground hover:bg-muted ${loading ? 'animate-spin' : ''}`}
        title="Re-run diagnostics"
      >
        <RotateCw className="h-3.5 w-3.5" />
      </button>

      {loading ? (
        <span className="text-xs text-muted-foreground">Running diagnostics...</span>
      ) : data ? (
        <div className="flex items-center gap-4 text-xs">
          {/* OpenRouter Status */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-muted-foreground">AI:</span>
            <StatusIcon status={data.openRouter.status} />
            <span className={getStatusColor(data.openRouter.status)}>
              {data.openRouter.status === 'ok' ? `${data.openRouter.latency}ms` : 'Error'}
            </span>
          </div>

          {/* OpenClaw Status */}
          <div className="flex items-center gap-1.5 border-l border-border pl-4">
            <span className="font-medium text-muted-foreground">Hooks:</span>
            <StatusIcon status={data.openClaw.status} />
            <span className={getStatusColor(data.openClaw.status)}>
              {data.openClaw.status === 'ok' ? 'Active' : data.openClaw.status}
            </span>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setIsOpen(false)}
        className="ml-1 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'ok') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === 'warning') return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
  return <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />;
}

function getStatusColor(status: string) {
  if (status === 'ok') return 'text-emerald-500';
  if (status === 'warning') return 'text-amber-500';
  return 'text-rose-500';
}


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
    <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl vitals-gradient-bg text-white">
                <Bot className="h-4.5 w-4.5" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                AI Assistant
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Health Agent</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask direct, data-aware questions about biomarkers, recovery, trends, and next actions.
            </p>
          </div>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-300">
            Beta
          </span>
          <DiagnosticButton />
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {/* Messages Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                  <Sparkles className="h-6 w-6 text-cyan-500" />
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
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-foreground transition hover:bg-accent"
                  >
                    Key insights
                  </button>
                  <button
                    onClick={() => setInput('How can I improve my biological age?')}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-foreground transition hover:bg-accent"
                  >
                    Improve biological age
                  </button>
                  <button
                    onClick={() => setInput('Analyze my sleep patterns')}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-foreground transition hover:bg-accent"
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
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                    ? 'vitals-gradient-bg text-white'
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
        <form onSubmit={handleSubmit} className="border-t border-border p-4 md:p-5">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your health data..."
              className="flex-1 rounded-xl border border-border bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center gap-2 rounded-xl vitals-gradient-bg px-5 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendHorizonal className="h-4 w-4" />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
