import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const BLOODWORK_DIR = path.join(DATA_DIR, 'Bloodwork');
const BODY_SCAN_DIR = path.join(DATA_DIR, 'Body Scan');
const ACTIVITY_DIR = path.join(DATA_DIR, 'Activity');

function fileEntry(name: string): fs.Dirent {
  return {
    name,
    isDirectory: () => false,
  } as fs.Dirent;
}

describe('getDataFiles', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockImplementation((target) => {
      const filePath = target.toString();

      if (filePath === BLOODWORK_DIR || filePath === BODY_SCAN_DIR || filePath === ACTIVITY_DIR) {
        return false;
      }

      if (filePath === DATA_DIR) {
        return true;
      }

      return true;
    });

    vi.mocked(fs.statSync).mockReturnValue({
      size: 1000,
      mtime: new Date('2024-01-01'),
    } as ReturnType<typeof fs.statSync>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should detect PDF files as supported', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      fileEntry('bloodwork.pdf'),
    ] as unknown as ReturnType<typeof fs.readdirSync>);

    const files = getDataFiles();

    expect(files).toHaveLength(1);
    expect(files[0].extension).toBe('.pdf');
    expect(files[0].type).toBe('bloodwork');
  });

  it('should detect lab-result PDF as bloodwork type', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      fileEntry('completed-lab-result-2025-12-26.pdf'),
    ] as unknown as ReturnType<typeof fs.readdirSync>);

    const files = getDataFiles();

    expect(files).toHaveLength(1);
    expect(files[0].type).toBe('bloodwork');
  });

  it('should support txt, csv, xlsx, and pdf extensions', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      fileEntry('blood.txt'),
      fileEntry('activity.csv'),
      fileEntry('data.xlsx'),
      fileEntry('labs.pdf'),
    ] as unknown as ReturnType<typeof fs.readdirSync>);

    const files = getDataFiles();

    expect(files).toHaveLength(4);
    expect(files.map((f) => f.extension)).toEqual(['.txt', '.csv', '.xlsx', '.pdf']);
  });
});
