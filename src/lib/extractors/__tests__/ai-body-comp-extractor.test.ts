import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGenerateText = vi.fn();

vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn()),
}));

import { extractBodyCompWithAI } from '../ai-body-comp-extractor';

describe('extractBodyCompWithAI', () => {
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalApiKey = process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    if (originalApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalApiKey;
  });

  it('does not write extracted body-composition measurements to logs', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({ bodyFatPercent: 27.4, leanMass: 112.6, vatMass: 1.4 }),
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const extracted = await extractBodyCompWithAI('synthetic DEXA report');
    const messages = logSpy.mock.calls.flat().map(String).join('\n');

    expect(extracted).toMatchObject({ bodyFatPercent: 27.4, leanMass: 112.6, vatMass: 1.4 });
    expect(messages).not.toContain('27.4');
    expect(messages).not.toContain('112.6');
    expect(messages).not.toContain('1.4');
  });
});
