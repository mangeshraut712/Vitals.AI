import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/files', () => ({
  getDataFiles: vi.fn(),
}));

vi.mock('@/lib/parsers/pdf', () => ({
  parsePdf: vi.fn(),
}));

vi.mock('@/lib/parsers/text', () => ({
  parseTextFile: vi.fn(),
}));

vi.mock('@/lib/parsers/csv', () => ({
  parseCsv: vi.fn(),
}));

vi.mock('@/lib/extractors/biomarkers', () => ({
  extractBiomarkers: vi.fn(() => ({})),
}));

vi.mock('@/lib/extractors/ai-extractor', async () => {
  const actual = await vi.importActual<typeof import('@/lib/extractors/ai-extractor')>(
    '@/lib/extractors/ai-extractor'
  );
  return {
    ...actual,
    extractBiomarkersWithAI: vi.fn(),
  };
});

vi.mock('@/lib/extractors/body-comp', () => ({
  extractBodyComposition: vi.fn(() => ({})),
}));

vi.mock('@/lib/cache', () => ({
  calculateFileHash: vi.fn(() => 'hash'),
  readManifest: vi.fn(() => ({ files: {} })),
  writeManifest: vi.fn(),
  needsExtraction: vi.fn(() => false),
  updateManifestEntry: vi.fn(),
  readBiomarkerCache: vi.fn(),
  writeBiomarkerCache: vi.fn(),
  readBodyCompCache: vi.fn(),
  writeBodyCompCache: vi.fn(),
  normalizeBiomarkerName: (name: string) => name,
}));

import { readBiomarkerCache } from '@/lib/cache';
import { getDataFiles } from '@/lib/files';

describe('cached absolute cell counts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (globalThis as { healthDataStore?: unknown }).healthDataStore;
  });

  it('scales a cached K/μL lymphocyte count when the cache is reloaded', async () => {
    vi.mocked(getDataFiles).mockReturnValue([
      {
        name: 'labs.pdf',
        type: 'bloodwork',
        path: '/data/labs.pdf',
        extension: '.pdf',
      },
    ]);
    vi.mocked(readBiomarkerCache).mockReturnValue({
      version: 1,
      extractedAt: '2026-01-01T00:00:00.000Z',
      sourceFile: 'labs.pdf',
      sourceHash: 'hash',
      patientAge: 35,
      biomarkers: [
        {
          id: 'lymphocytes',
          name: 'Lymphocytes',
          value: 1.8,
          unit: 'K/μL',
          source: 'measured',
        },
      ],
    });

    const { HealthDataStore } = await import('../health-data');
    await HealthDataStore.loadAllData();
    const biomarkers = await HealthDataStore.getBiomarkers();

    expect(biomarkers.lymphocytes).toBe(1800);
    expect(biomarkers.all?.[0]).toMatchObject({ value: 1800, unit: 'cells/uL' });
  });
});
