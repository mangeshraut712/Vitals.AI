import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
  },
}));

import fs from 'fs';
import { getDataFiles } from '../files';

describe('getDataFiles', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      size: 1000,
      mtime: new Date('2024-01-01'),
    } as ReturnType<typeof fs.statSync>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should detect PDF files as supported', () => {
    vi.mocked(fs.readdirSync).mockReturnValue(['bloodwork.pdf'] as unknown as ReturnType<typeof fs.readdirSync>);

    const files = getDataFiles();

    expect(files).toHaveLength(1);
    expect(files[0].extension).toBe('.pdf');
    expect(files[0].type).toBe('bloodwork');
  });

  it('should detect lab-result PDF as bloodwork type', () => {
    vi.mocked(fs.readdirSync).mockReturnValue(['completed-lab-result-2025-12-26.pdf'] as unknown as ReturnType<typeof fs.readdirSync>);

    const files = getDataFiles();

    expect(files).toHaveLength(1);
    expect(files[0].type).toBe('bloodwork');
  });

  it('should support txt, csv, xlsx, and pdf extensions', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      'blood.txt',
      'activity.csv',
      'data.xlsx',
      'labs.pdf',
    ] as unknown as ReturnType<typeof fs.readdirSync>);

    const files = getDataFiles();

    expect(files).toHaveLength(4);
    expect(files.map((f) => f.extension)).toEqual(['.txt', '.csv', '.xlsx', '.pdf']);
  });
});
