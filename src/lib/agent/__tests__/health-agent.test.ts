import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGenerateText = vi.fn();
const mockStreamText = vi.fn();

vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  streamText: (...args: unknown[]) => mockStreamText(...args),
}));

vi.mock('@ai-sdk/openai', () => {
  const mockModel = vi.fn(() => ({
    generateText: mockGenerateText,
  }));
  return {
    createOpenAI: vi.fn(() => mockModel),
  };
});

import { queryHealthAgent } from '../health-agent';

describe('queryHealthAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('removes unverified source URLs from agent output', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'Sources: https://example.com/article and https://www.nih.gov/health-information',
    });

    const result = await queryHealthAgent('What does this mean?', 'context');

    expect(result.error).toBeUndefined();
    expect(result.content).toContain('[source-removed]');
    expect(result.content).toContain('https://www.nih.gov/health-information');
    expect(result.content).toContain('unverified links were removed');
  });

  it('returns message when API key is missing', async () => {
    delete process.env.OPENROUTER_API_KEY;

    const result = await queryHealthAgent('What does this mean?', 'context');

    expect(result.error).toBeUndefined();
    expect(result.content).toContain('OPENROUTER_API_KEY');
  });
});
