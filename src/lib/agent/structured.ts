import { z } from 'zod';
import { HEALTH_TOOL_NAMES } from '@/lib/agent/tool-names';
import type { ToolExecutionResult } from '@/lib/agent/health-tools';

export const HealthFindingSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  severity: z.enum(['info', 'watch', 'action']),
});

export const HealthInsightSchema = z.object({
  headline: z.string().min(1),
  toolsUsed: z.array(z.enum(HEALTH_TOOL_NAMES)),
  findings: z.array(HealthFindingSchema).max(8),
  nextAction: z.string().min(1),
  empty: z.boolean(),
});

export type HealthInsight = z.infer<typeof HealthInsightSchema>;

function severityFromTone(tone: ToolExecutionResult['metrics'][number]['tone']): HealthInsight['findings'][number]['severity'] {
  switch (tone) {
    case 'good':
    case 'default':
      return 'info';
    case 'warn':
      return 'watch';
    case 'bad':
      return 'action';
    default: {
      const exhaustive: never = tone;
      throw new Error(`Unhandled metric tone: ${String(exhaustive)}`);
    }
  }
}

export function buildInsightFromTools(query: string, results: ToolExecutionResult[]): HealthInsight {
  const toolsUsed = results.map((result) => result.tool);
  const empty = results.length === 0 || results.every((result) => result.empty);

  if (results.length === 0) {
    return HealthInsightSchema.parse({
      headline: 'No tools were selected for that question.',
      toolsUsed: [],
      findings: [
        {
          title: 'Try a health question',
          detail: 'Ask about CRP, sleep, or biological age so the agent can call a tool.',
          severity: 'info',
        },
      ],
      nextAction: 'Ask about a biomarker, recovery, or your overall score.',
      empty: true,
    });
  }

  if (empty) {
    return HealthInsightSchema.parse({
      headline: 'Tools ran, but no local health files are loaded.',
      toolsUsed,
      findings: results.map((result) => ({
        title: result.tool,
        detail: result.summary,
        severity: 'watch' as const,
      })),
      nextAction: 'Add lab or wearable files under /data and click Sync, or keep exploring with the sample Pages demo.',
      empty: true,
    });
  }

  const findings = results.flatMap((result) => {
    if (result.empty) {
      return [
        {
          title: result.tool,
          detail: result.summary,
          severity: 'watch' as const,
        },
      ];
    }
    return result.metrics.slice(0, 2).map((metric) => ({
      title: metric.label,
      detail: `${metric.value}. ${result.summary}`,
      severity: severityFromTone(metric.tone),
    }));
  });

  return HealthInsightSchema.parse({
    headline: `Health agent for: ${query.trim().slice(0, 80) || 'your question'}`,
    toolsUsed,
    findings: findings.slice(0, 6),
    nextAction: findings.some((finding) => finding.severity === 'action')
      ? 'Review out-of-range markers with a clinician; this dashboard is not medical advice.'
      : 'Keep tracking the same markers so trends are comparable week to week.',
    empty: false,
  });
}

export function formatInsightText(insight: HealthInsight): string {
  const findingLines = insight.findings
    .map((finding) => `- ${finding.title}: ${finding.detail}`)
    .join('\n');
  return `${insight.headline}\n\n${findingLines}\n\nNext: ${insight.nextAction}\n\nThis is wellness context, not a diagnosis.`;
}

export function parseHealthInsight(value: unknown): HealthInsight {
  return HealthInsightSchema.parse(value);
}
