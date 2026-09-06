'use client';

import { useState } from 'react';
import { Bot, SendHorizonal, Sparkles, Activity, CheckCircle2, AlertTriangle, XCircle, RotateCw } from 'lucide-react';
import { streamChatEvents } from '@/lib/ai-chat/chatWithAI';
import { isGitHubPagesExport, withBasePath } from '@/lib/runtime/paths';
import { TOOL_CATALOG, type AgentRuntimeMode } from '@/lib/agent/agent-events';
import type { HealthToolName } from '@/lib/agent/tool-names';
import type { ToolExecutionResult } from '@/lib/agent/health-tools';
import { ToolResultView } from '@/components/agent/ToolResultView';

interface DiagnosticResult {
  status: 'ok' | 'error' | 'warning' | 'pending';
  message: string;
  latency: number;
}

interface DiagnosticsData {
  openRouter: DiagnosticResult;
  openClaw: DiagnosticResult;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  tools: ToolExecutionResult[];
  pendingTools: HealthToolName[];
}

const PROMPTS = [
  { label: 'Key insights', query: 'What are my key health insights?' },
  { label: 'CRP lookup', query: 'What is my CRP?' },
  { label: 'Sleep analysis', query: 'How did I sleep this week?' },
  { label: 'Biological age', query: "What's my biological age and overall score?" },
] as const;

function DiagnosticButton() {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setIsOpen(true);
    try {
      const res = await fetch(withBasePath('/api/agent/diagnostics'));
      const json = await res.json();
      setData(json);
    } catch {
      setData({
        openRouter: { status: 'warning', message: 'Diagnostics API is not on GitHub Pages.', latency: 0 },
        openClaw: { status: 'warning', message: 'Hooks require a local Node server.', latency: 0 },
      });
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
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-muted-foreground">AI:</span>
            <StatusIcon status={data.openRouter.status} />
            <span className={getStatusColor(data.openRouter.status)}>
              {data.openRouter.status === 'ok' ? `${data.openRouter.latency}ms` : data.openRouter.status}
            </span>
          </div>
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
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AgentRuntimeMode>(isGitHubPagesExport() ? 'demo' : 'live');
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (raw: string): Promise<void> => {
    const userMessage = raw.trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, tools: [], pendingTools: [] }]);
    setIsLoading(true);

    const assistant: ChatTurn = { role: 'assistant', content: '', tools: [], pendingTools: [] };
    setMessages((prev) => [...prev, assistant]);

    try {
      let assistantContent = '';
      const tools: ToolExecutionResult[] = [];
      const pendingTools: HealthToolName[] = [];
      let receivedText = false;

      for await (const event of streamChatEvents(userMessage)) {
        switch (event.type) {
          case 'mode':
            setMode(event.mode);
            break;
          case 'text':
            receivedText = true;
            assistantContent += event.text;
            break;
          case 'tool':
            if (event.status === 'start') {
              pendingTools.push(event.name);
            } else if (event.result && typeof event.result === 'object') {
              tools.push(event.result as ToolExecutionResult);
              const idx = pendingTools.indexOf(event.name);
              if (idx >= 0) pendingTools.splice(idx, 1);
            }
            break;
          case 'error':
            setError(event.message);
            assistantContent = assistantContent || event.message;
            receivedText = true;
            break;
          default: {
            const exhaustive: never = event;
            void exhaustive;
            break;
          }
        }

        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'assistant') {
            next[next.length - 1] = {
              role: 'assistant',
              content: assistantContent,
              tools: [...tools],
              pendingTools: [...pendingTools],
            };
          }
          return next;
        });
      }

      if (!receivedText && tools.length === 0) {
        setError('Sorry, I could not generate a response. Please try again.');
      }
    } catch {
      setError('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await sendMessage(input);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6" data-testid="agent-page">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl vitals-gradient-bg text-white">
                <Bot className="h-4.5 w-4.5" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Agent showcase
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Health Agent</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Three AI SDK tools — biomarker lookup, recovery snapshot, health scorecard — with streaming text,
              empty states, and optional OpenTelemetry around each call.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300" data-testid="agent-mode">
              {mode === 'demo' ? 'Sample demo' : mode === 'offline' ? 'Local tools' : 'Live model'}
            </span>
            <DiagnosticButton />
          </div>
        </div>
        <ul className="relative z-10 mt-4 grid gap-2 sm:grid-cols-3" data-testid="agent-tool-catalog">
          {TOOL_CATALOG.map((tool) => (
            <li key={tool.name} className="rounded-2xl border border-border bg-background/70 px-3 py-2">
              <p className="text-xs font-semibold text-foreground">{tool.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{tool.description}</p>
            </li>
          ))}
        </ul>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center" data-testid="agent-empty-state">
              <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                  <Sparkles className="h-6 w-6 text-cyan-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Ask the health agent
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  On GitHub Pages this runs tools against a public sample panel. Locally, the same UI streams
                  OpenRouter tool calls over your `/data` files.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-sm">
                  {PROMPTS.map((prompt) => (
                    <button
                      key={prompt.label}
                      type="button"
                      onClick={() => void sendMessage(prompt.query)}
                      data-testid={`agent-prompt-${prompt.label.toLowerCase().replace(/\s+/g, '-')}`}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-foreground transition hover:bg-accent"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] space-y-2 rounded-2xl px-4 py-3 ${msg.role === 'user'
                    ? 'vitals-gradient-bg text-white'
                    : 'bg-muted text-foreground'
                    }`}
                >
                  {msg.pendingTools.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Calling {msg.pendingTools.join(', ')}…
                    </p>
                  ) : null}
                  {msg.tools.map((tool, toolIndex) => (
                    <ToolResultView key={`${tool.tool}-${toolIndex}`} result={tool} />
                  ))}
                  {msg.content ? (
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  ) : null}
                </div>
              </div>
            ))
          )}
          {error && messages.length > 0 ? (
            <p className="text-sm text-rose-600 dark:text-rose-400" data-testid="agent-error">
              {error}
            </p>
          ) : null}
          {isLoading ? (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border p-4 md:p-5">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about CRP, sleep, or biological age..."
              className="flex-1 rounded-xl border border-border bg-muted px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={isLoading}
              data-testid="agent-input"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center gap-2 rounded-xl vitals-gradient-bg px-5 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="agent-send"
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
