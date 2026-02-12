import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules
vi.mock('@/lib/files', () => ({
  getDataFiles: vi.fn(),
}));

vi.mock('@/lib/parsers/text', () => ({
  parseTextFile: vi.fn(),
}));

vi.mock('@/lib/parsers/pdf', () => ({
  parsePdf: vi.fn(),
}));

vi.mock('@/lib/parsers/csv', () => ({
  parseCsv: vi.fn(),
}));

vi.mock('@/lib/extractors/biomarkers', () => ({
  extractBiomarkers: vi.fn(),
}));

vi.mock('@/lib/extractors/ai-extractor', () => ({
  extractBiomarkersWithAI: vi.fn(),
}));

vi.mock('@/lib/extractors/body-comp', () => ({
  extractBodyComposition: vi.fn(),
}));

vi.mock('@/lib/calculations/phenoage', () => ({
  calculatePhenoAge: vi.fn(),
}));

import { getDataFiles } from '@/lib/files';
import { parseTextFile } from '@/lib/parsers/text';
import { parsePdf } from '@/lib/parsers/pdf';
import { extractBiomarkers } from '@/lib/extractors/biomarkers';
import { extractBiomarkersWithAI } from '@/lib/extractors/ai-extractor';
import { extractBodyComposition } from '@/lib/extractors/body-comp';
import { calculatePhenoAge } from '@/lib/calculations/phenoage';

describe('HealthDataStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Default mock returns
    vi.mocked(extractBiomarkers).mockReturnValue({});
    vi.mocked(extractBiomarkersWithAI).mockResolvedValue({});
    vi.mocked(extractBodyComposition).mockReturnValue({});
    vi.mocked(calculatePhenoAge).mockReturnValue({ phenoAge: 40, delta: -5 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should parse PDF bloodwork files with AI extraction', async () => {
    vi.mocked(getDataFiles).mockReturnValue([
      {
        name: 'labs.pdf',
        type: 'bloodwork',
        path: '/data/labs.pdf',
        extension: '.pdf',
      },
    ]);
    vi.mocked(parsePdf).mockResolvedValue('Glucose: 95 mg/dL');
    vi.mocked(extractBiomarkersWithAI).mockResolvedValue({ glucose: 95 });

    // Re-import to get fresh instance
    const { HealthDataStore } = await import('../health-data');

    // Force async reload
    await HealthDataStore.loadAllData();

    expect(parsePdf).toHaveBeenCalledWith('/data/labs.pdf');
    // PDFs use AI extraction, not regex
    expect(extractBiomarkersWithAI).toHaveBeenCalledWith('Glucose: 95 mg/dL');
  });

  it('should still parse TXT bloodwork files', async () => {
    vi.mocked(getDataFiles).mockReturnValue([
      {
        name: 'blood.txt',
        type: 'bloodwork',
        path: '/data/blood.txt',
        extension: '.txt',
      },
    ]);
    vi.mocked(parseTextFile).mockReturnValue('Glucose: 95');
    vi.mocked(extractBiomarkers).mockReturnValue({ glucose: 95 });

    const { HealthDataStore } = await import('../health-data');
    await HealthDataStore.loadAllData();

    expect(parseTextFile).toHaveBeenCalledWith('/data/blood.txt');
    expect(extractBiomarkers).toHaveBeenCalledWith('Glucose: 95');
  });

  it('should generate canonical health events after data load', async () => {
    vi.mocked(getDataFiles).mockReturnValue([
      {
        name: 'blood.txt',
        type: 'bloodwork',
        path: '/data/blood.txt',
        extension: '.txt',
      },
    ]);
    vi.mocked(parseTextFile).mockReturnValue('Glucose: 95');
    vi.mocked(extractBiomarkers).mockReturnValue({
      glucose: 95,
      patientAge: 35,
    });

    const { HealthDataStore } = await import('../health-data');
    await HealthDataStore.loadAllData();

    const events = await HealthDataStore.getHealthEvents({ limit: 10 });

    expect(events.length).toBeGreaterThan(0);
    expect(events.some((event) => event.domain === 'biomarker')).toBe(true);
    expect(events.some((event) => event.metric.toLowerCase().includes('glucose'))).toBe(true);
  });

  it('should fallback to regex extraction when AI biomarker extraction fails', async () => {
    vi.mocked(getDataFiles).mockReturnValue([
      {
        name: 'labs.pdf',
        type: 'bloodwork',
        path: '/data/labs.pdf',
        extension: '.pdf',
      },
    ]);
    vi.mocked(parsePdf).mockResolvedValue('Glucose: 101');
    vi.mocked(extractBiomarkersWithAI).mockRejectedValue(new Error('Missing API key'));
    vi.mocked(extractBiomarkers).mockReturnValue({ glucose: 101, patientAge: 40 });

    const { HealthDataStore } = await import('../health-data');
    await HealthDataStore.loadAllData();

    const biomarkers = await HealthDataStore.getBiomarkers();

    expect(extractBiomarkersWithAI).toHaveBeenCalledWith('Glucose: 101');
    expect(extractBiomarkers).toHaveBeenCalledWith('Glucose: 101');
    expect(biomarkers.glucose).toBe(101);
  });

  it('should handle mixed file types', async () => {
    vi.mocked(getDataFiles).mockReturnValue([
      {
        name: 'labs.pdf',
        type: 'bloodwork',
        path: '/data/labs.pdf',
        extension: '.pdf',
      },
      {
        name: 'dexa.txt',
        type: 'dexa',
        path: '/data/dexa.txt',
        extension: '.txt',
      },
    ]);
    vi.mocked(parsePdf).mockResolvedValue('Glucose: 100');
    vi.mocked(parseTextFile).mockReturnValue('Body Fat: 15%');
    vi.mocked(extractBiomarkersWithAI).mockResolvedValue({ glucose: 100 });
    vi.mocked(extractBodyComposition).mockReturnValue({ bodyFatPercent: 15 });

    const { HealthDataStore } = await import('../health-data');
    await HealthDataStore.loadAllData();

    expect(parsePdf).toHaveBeenCalledWith('/data/labs.pdf');
    expect(parseTextFile).toHaveBeenCalledWith('/data/dexa.txt');
    // PDFs use AI extraction
    expect(extractBiomarkersWithAI).toHaveBeenCalledWith('Glucose: 100');
  });
});
