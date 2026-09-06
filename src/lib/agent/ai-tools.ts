import { tool } from 'ai';
import { withSpan } from '@/lib/observability/tracing';
import type { HealthSnapshot } from '@/lib/agent/health-snapshot';
import {
  HealthScorecardInputSchema,
  LookupBiomarkerInputSchema,
  RecoverySnapshotInputSchema,
  executeHealthTool,
} from '@/lib/agent/health-tools';

export function createHealthAiTools(snapshot: HealthSnapshot) {
  return {
    lookupBiomarker: tool({
      description:
        'Look up a biomarker from the user lab panel (CRP, LDL, glucose, HbA1c, etc.) or pass query "summary" for flagged markers.',
      inputSchema: LookupBiomarkerInputSchema,
      execute: async (input) =>
        withSpan('tool.lookupBiomarker', { 'tool.name': 'lookupBiomarker' }, async () =>
          executeHealthTool('lookupBiomarker', input, snapshot)
        ),
    }),
    getRecoverySnapshot: tool({
      description: 'Return 7-day averages for HRV, sleep, resting heart rate, recovery, and steps from wearables.',
      inputSchema: RecoverySnapshotInputSchema,
      execute: async (input) =>
        withSpan('tool.getRecoverySnapshot', { 'tool.name': 'getRecoverySnapshot' }, async () =>
          executeHealthTool('getRecoverySnapshot', input, snapshot)
        ),
    }),
    getHealthScorecard: tool({
      description: 'Compute the composite health score and Levine PhenoAge delta from loaded labs and activity.',
      inputSchema: HealthScorecardInputSchema,
      execute: async (input) =>
        withSpan('tool.getHealthScorecard', { 'tool.name': 'getHealthScorecard' }, async () =>
          executeHealthTool('getHealthScorecard', input, snapshot)
        ),
    }),
  };
}
