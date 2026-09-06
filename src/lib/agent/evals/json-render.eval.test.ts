import { describe, expect, it } from 'vitest';
import { applyMockedToolCalls } from '../health-tools';
import { DEMO_HEALTH_SNAPSHOT } from '../demo-snapshot';
import { toolResultToSpec } from '../tool-ui-spec';

describe('json-render tool specs', () => {
  it('builds a ToolCard spec from a biomarker tool result', () => {
    const [result] = applyMockedToolCalls(
      [{ name: 'lookupBiomarker', input: { query: 'CRP' } }],
      DEMO_HEALTH_SNAPSHOT
    );
    const spec = toolResultToSpec(result);
    expect(spec.root).toBe('card');
    expect(spec.elements.card.type).toBe('ToolCard');
    expect(spec.elements.metrics.type).toBe('MetricList');
  });
});
