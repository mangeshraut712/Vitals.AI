import { describe, expect, it, vi } from 'vitest';
import { STRUCTURED_INSIGHT_FIXTURE, TOOL_SELECTION_FIXTURES } from './fixtures';
import { applyMockedToolCalls } from '../health-tools';
import { DEMO_HEALTH_SNAPSHOT } from '../demo-snapshot';
import { buildInsightFromTools, HealthInsightSchema, parseHealthInsight } from '../structured';

const mockGenerateObject = vi.fn();

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();
  return {
    ...actual,
    generateObject: (...args: unknown[]) => mockGenerateObject(...args),
  };
});

describe('eval: structured outputs', () => {
  it('accepts a fixture insight that matches the schema', () => {
    expect(parseHealthInsight(STRUCTURED_INSIGHT_FIXTURE)).toEqual(STRUCTURED_INSIGHT_FIXTURE);
  });

  it('rejects malformed model JSON', () => {
    expect(() =>
      parseHealthInsight({
        headline: '',
        toolsUsed: ['not-a-tool'],
        findings: [],
      })
    ).toThrow();
  });

  it.each(TOOL_SELECTION_FIXTURES.filter((fixture) => fixture.modelToolCalls.length > 0))(
    '$id tool results compile to a valid insight',
    (fixture) => {
      const results = applyMockedToolCalls(fixture.modelToolCalls, DEMO_HEALTH_SNAPSHOT);
      const insight = buildInsightFromTools(fixture.query, results);
      expect(HealthInsightSchema.parse(insight).toolsUsed).toEqual(
        fixture.modelToolCalls.map((call) => call.name)
      );
      expect(insight.findings.length).toBeGreaterThan(0);
    }
  );

  it('mocked generateObject result is schema-validated', async () => {
    mockGenerateObject.mockResolvedValue({ object: STRUCTURED_INSIGHT_FIXTURE });
    const { generateObject } = await import('ai');
    const { object } = await generateObject({
      model: {} as never,
      schema: HealthInsightSchema,
      prompt: 'unused in mock',
    });
    expect(HealthInsightSchema.parse(object).headline).toContain('CRP');
  });
});
