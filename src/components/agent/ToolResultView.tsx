'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { defineRegistry, Renderer, StateProvider } from '@json-render/react';
import { z } from 'zod';
import type { ToolExecutionResult } from '@/lib/agent/health-tools';
import { toolResultToSpec } from '@/lib/agent/tool-ui-spec';

const MetricSchema = z.object({
  label: z.string(),
  value: z.string(),
  tone: z.enum(['default', 'good', 'warn', 'bad']),
});

export const agentCatalog = defineCatalog(schema, {
  components: {
    ToolCard: {
      props: z.object({
        toolName: z.string(),
        empty: z.boolean(),
        summary: z.string(),
      }),
      slots: ['default'],
      description: 'Card wrapping one health-agent tool result',
    },
    MetricList: {
      props: z.object({
        items: z.array(MetricSchema),
      }),
      description: 'List of metric rows from a tool',
    },
  },
  actions: {},
});

function toneClass(tone: z.infer<typeof MetricSchema>['tone']): string {
  switch (tone) {
    case 'good':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'warn':
      return 'text-amber-600 dark:text-amber-400';
    case 'bad':
      return 'text-rose-600 dark:text-rose-400';
    case 'default':
      return 'text-foreground';
    default: {
      const exhaustive: never = tone;
      throw new Error(`Unhandled tone: ${String(exhaustive)}`);
    }
  }
}

function ToolCardFallback({ result }: { result: ToolExecutionResult }): React.JSX.Element {
  return (
    <article className="rounded-2xl border border-border bg-background/80 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {result.tool}
      </p>
      <p className="mt-1 text-sm text-foreground">{result.summary}</p>
      {result.empty ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">Empty result</p>
      ) : null}
      <ul className="mt-2 space-y-1.5">
        {result.metrics.map((item) => (
          <li key={item.label} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className={`font-medium ${toneClass(item.tone)}`}>{item.value}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

const { registry } = defineRegistry(agentCatalog, {
  components: {
    ToolCard: ({ props, children }) => (
      <article className="rounded-2xl border border-border bg-muted/40 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {props.toolName}
        </p>
        <p className="mt-1 text-sm text-foreground">{props.summary}</p>
        {props.empty ? (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">Empty result</p>
        ) : null}
        <div className="mt-2">{children}</div>
      </article>
    ),
    MetricList: ({ props }) => (
      <ul className="space-y-1.5">
        {props.items.map((item) => (
          <li key={item.label} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className={`font-medium ${toneClass(item.tone)}`}>{item.value}</span>
          </li>
        ))}
      </ul>
    ),
  },
});

class JsonRenderBoundary extends Component<
  { result: ToolExecutionResult; children: ReactNode },
  { failed: boolean }
> {
  constructor(props: { result: ToolExecutionResult; children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('[Vitals.AI] json-render tool card failed; using fallback', error, info);
  }

  render(): ReactNode {
    if (this.state.failed) {
      return <ToolCardFallback result={this.props.result} />;
    }
    return this.props.children;
  }
}

export function ToolResultView({ result }: { result: ToolExecutionResult }): React.JSX.Element {
  return (
    <div data-testid="agent-tool-result">
      <JsonRenderBoundary result={result}>
        <StateProvider>
          <Renderer spec={toolResultToSpec(result)} registry={registry} />
        </StateProvider>
      </JsonRenderBoundary>
    </div>
  );
}
