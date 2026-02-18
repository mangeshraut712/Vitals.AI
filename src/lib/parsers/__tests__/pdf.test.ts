import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

import fs from 'fs';
import { __setPdfParseForTests, parsePdf } from '../pdf';

describe('parsePdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __setPdfParseForTests(null);
  });

  it('should export parsePdf function', () => {
    expect(typeof parsePdf).toBe('function');
  });

  it('should return empty string for non-existent file', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = await parsePdf('/nonexistent/file.pdf');

    expect(result).toBe('');
  });

  it('should extract text when PDF exists', async () => {
    const mockPdfParse = vi.fn().mockResolvedValue({ text: 'glucose cholesterol blood lab report' });
    __setPdfParseForTests(mockPdfParse);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('%PDF test'));

    const result = await parsePdf('/tmp/lab-results.pdf');

    expect(result).toContain('glucose');
    expect(result.length).toBeGreaterThan(10);
    expect(mockPdfParse).toHaveBeenCalledTimes(1);
  });

  it('should return empty string when parser throws', async () => {
    const mockPdfParse = vi.fn().mockRejectedValue(new Error('parse failed'));
    __setPdfParseForTests(mockPdfParse);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('%PDF test'));

    const result = await parsePdf('/tmp/broken.pdf');

    expect(result).toBe('');
  });
});
