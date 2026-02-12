import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class AnthropicMock {
    messages = {
      create: mockCreate,
    };
  },
}));

import { queryHealthAgent } from '../health-agent';

describe('queryHealthAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('removes unverified source URLs from agent output', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Sources: https://example.com/article and https://www.nih.gov/health-information',
        },
      ],
    });

    const result = await queryHealthAgent('What does this mean?', 'context');

    expect(result.error).toBeUndefined();
    expect(result.content).toContain('[source-removed]');
    expect(result.content).toContain('https://www.nih.gov/health-information');
    expect(result.content).toContain('unverified links were removed');
  });
});
