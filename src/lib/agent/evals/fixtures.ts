import type { HealthToolName } from '@/lib/agent/tool-names';
import type { MockToolCall } from '@/lib/agent/health-tools';

export interface ToolSelectionFixture {
  id: string;
  query: string;
  expectedTools: HealthToolName[];
  modelToolCalls: MockToolCall[];
}

export const TOOL_SELECTION_FIXTURES: ToolSelectionFixture[] = [
  {
    id: 'crp-lookup',
    query: 'What is my CRP?',
    expectedTools: ['lookupBiomarker'],
    modelToolCalls: [{ name: 'lookupBiomarker', input: { query: 'CRP' } }],
  },
  {
    id: 'sleep-recovery',
    query: 'How did I sleep this week?',
    expectedTools: ['getRecoverySnapshot'],
    modelToolCalls: [{ name: 'getRecoverySnapshot', input: { days: 7 } }],
  },
  {
    id: 'phenoage-score',
    query: "What's my biological age and overall score?",
    expectedTools: ['getHealthScorecard'],
    modelToolCalls: [{ name: 'getHealthScorecard', input: { includeBreakdown: true } }],
  },
  {
    id: 'key-insights',
    query: 'What are my key health insights?',
    expectedTools: ['lookupBiomarker', 'getRecoverySnapshot', 'getHealthScorecard'],
    modelToolCalls: [
      { name: 'lookupBiomarker', input: { query: 'summary' } },
      { name: 'getRecoverySnapshot', input: { days: 7 } },
      { name: 'getHealthScorecard', input: { includeBreakdown: true } },
    ],
  },
  {
    id: 'empty-greeting',
    query: 'Hello there',
    expectedTools: [],
    modelToolCalls: [],
  },
];

export const STRUCTURED_INSIGHT_FIXTURE = {
  headline: 'CRP is above the longevity target',
  toolsUsed: ['lookupBiomarker'] as HealthToolName[],
  findings: [
    {
      title: 'CRP',
      detail: '0.7 mg/L vs optimal under 0.5 mg/L.',
      severity: 'watch' as const,
    },
  ],
  nextAction: 'Retest hs-CRP after two weeks of sleep consistency.',
  empty: false,
};
