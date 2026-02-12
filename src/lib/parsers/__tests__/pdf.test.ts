import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

import fs from 'fs';
import pdfParse from 'pdf-parse';
import { parsePdf } from '../pdf';

describe('parsePdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export parsePdf function', () => {
    expect(typeof parsePdf).toBe('function');
  });

  it('should return empty string for non-existent file', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = await parsePdf('/nonexistent/file.pdf');

    expect(result).toBe('');
    expect(pdfParse).not.toHaveBeenCalled();
  });

  it('should extract text when PDF exists', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('%PDF test'));
    vi.mocked(pdfParse).mockResolvedValue({ text: 'glucose cholesterol blood lab report' } as never);

    const result = await parsePdf('/tmp/lab-results.pdf');

    expect(result).toContain('glucose');
    expect(result.length).toBeGreaterThan(10);
    expect(pdfParse).toHaveBeenCalledTimes(1);
  });

  it('should return empty string when parser throws', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('%PDF test'));
    vi.mocked(pdfParse).mockRejectedValue(new Error('parse failed'));

    const result = await parsePdf('/tmp/broken.pdf');

    expect(result).toBe('');
  });
});
