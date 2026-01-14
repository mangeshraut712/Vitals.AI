import { describe, it, expect } from 'vitest';
import path from 'path';

describe('parsePdf', () => {
  it('should export parsePdf function', async () => {
    const { parsePdf } = await import('../pdf');
    expect(typeof parsePdf).toBe('function');
  });

  it('should return empty string for non-existent file', async () => {
    const { parsePdf } = await import('../pdf');
    const result = await parsePdf('/nonexistent/file.pdf');
    expect(result).toBe('');
  });

  it('should extract text from actual PDF in data folder', async () => {
    const { parsePdf } = await import('../pdf');
    const pdfPath = path.join(process.cwd(), 'data', 'completed-lab-result-2025-12-26.pdf');

    const result = await parsePdf(pdfPath);

    // Should contain some text
    expect(result.length).toBeGreaterThan(100);
    // Should contain common lab result terms
    expect(result.toLowerCase()).toMatch(/glucose|cholesterol|blood|lab/i);
  });
});
