import { describe, expect, it } from 'vitest';
import { TOOL_SELECTION_FIXTURES } from './fixtures';
import { selectToolsForQuery } from '../tool-policy';
import { applyMockedToolCalls } from '../health-tools';
import { DEMO_HEALTH_SNAPSHOT, EMPTY_HEALTH_SNAPSHOT } from '../demo-snapshot';
import { HEALTH_TOOL_NAMES } from '../tool-names';

describe('eval: tool selection', () => {
  it.each(TOOL_SELECTION_FIXTURES)('$id policy matches expected tools', (fixture) => {
    expect(selectToolsForQuery(fixture.query)).toEqual(fixture.expectedTools);
  });

  it.each(TOOL_SELECTION_FIXTURES)('$id mocked model calls execute the named tools', (fixture) => {
    const executed = applyMockedToolCalls(fixture.modelToolCalls, DEMO_HEALTH_SNAPSHOT).map(
      (result) => result.tool
    );
    expect(executed).toEqual(fixture.modelToolCalls.map((call) => call.name));
  });

  it('demo snapshot produces non-empty results for the three showcase tools', () => {
    const results = applyMockedToolCalls(
      HEALTH_TOOL_NAMES.map((name) => ({ name, input: name === 'lookupBiomarker' ? { query: 'CRP' } : {} })),
      DEMO_HEALTH_SNAPSHOT
    );
    expect(results.every((result) => result.empty === false)).toBe(true);
  });

  it('empty snapshot surfaces empty states instead of invented metrics', () => {
    const results = applyMockedToolCalls(
      [
        { name: 'lookupBiomarker', input: { query: 'CRP' } },
        { name: 'getRecoverySnapshot', input: {} },
        { name: 'getHealthScorecard', input: {} },
      ],
      EMPTY_HEALTH_SNAPSHOT
    );
    expect(results.every((result) => result.empty)).toBe(true);
    expect(results.every((result) => result.metrics.length === 0)).toBe(true);
  });
});
