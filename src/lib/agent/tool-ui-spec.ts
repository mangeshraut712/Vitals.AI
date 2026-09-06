import type { Spec } from '@json-render/core';
import type { ToolExecutionResult } from '@/lib/agent/health-tools';

export function toolResultToSpec(result: ToolExecutionResult): Spec {
  return {
    root: 'card',
    elements: {
      card: {
        type: 'ToolCard',
        props: {
          toolName: result.tool,
          empty: result.empty,
          summary: result.summary,
        },
        children: ['metrics'],
      },
      metrics: {
        type: 'MetricList',
        props: { items: result.metrics },
        children: [],
      },
    },
  };
}
