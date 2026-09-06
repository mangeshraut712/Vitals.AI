import { defaultInputForTool, selectToolsForQuery } from '@/lib/agent/tool-policy';
import { executeHealthTool, type ToolExecutionResult } from '@/lib/agent/health-tools';
import { buildInsightFromTools, formatInsightText } from '@/lib/agent/structured';
import type { AgentStreamEvent } from '@/lib/agent/agent-events';
import type { HealthSnapshot } from '@/lib/agent/health-snapshot';
import type { AgentRuntimeMode } from '@/lib/agent/agent-events';

export async function runDeterministicAgentTurn(options: {
  message: string;
  snapshot: HealthSnapshot;
  mode: AgentRuntimeMode;
  onEvent: (event: AgentStreamEvent) => void;
}): Promise<{ content: string; tools: ToolExecutionResult[] }> {
  const { message, snapshot, mode, onEvent } = options;
  onEvent({ type: 'mode', mode });

  const selected = selectToolsForQuery(message);
  const tools: ToolExecutionResult[] = [];

  for (const name of selected) {
    onEvent({ type: 'tool', name, status: 'start', input: defaultInputForTool(name, message) });
    const result = executeHealthTool(name, defaultInputForTool(name, message), snapshot);
    tools.push(result);
    onEvent({ type: 'tool', name, status: 'result', result });
  }

  const insight = buildInsightFromTools(message, tools);
  const prefix =
    mode === 'demo'
      ? 'Sample-data demo (GitHub Pages). Tools ran locally on a public fixture, not your files.\n\n'
      : mode === 'offline'
        ? 'Offline mode: tools ran on local files without calling a paid model.\n\n'
        : '';
  const content = `${prefix}${formatInsightText(insight)}`;
  onEvent({ type: 'text', text: content });
  return { content, tools };
}
