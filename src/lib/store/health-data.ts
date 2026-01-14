import { getDataFiles } from '@/lib/files';
import { parseTextFile } from '@/lib/parsers/text';
import { parsePdf } from '@/lib/parsers/pdf';
import { parseCsv, CsvRow } from '@/lib/parsers/csv';
import { extractBiomarkers, ExtractedBiomarkers } from '@/lib/extractors/biomarkers';
import { extractBodyComposition, BodyComposition } from '@/lib/extractors/body-comp';
import { calculatePhenoAge, PhenoAgeResult } from '@/lib/calculations/phenoage';

export interface ActivityData {
  date: string;
  hrv: number;
  rhr: number;
  sleepHours: number;
  sleepScore?: number;
  strain?: number;
}

export interface HealthData {
  biomarkers: ExtractedBiomarkers;
  bodyComp: BodyComposition;
  activity: ActivityData[];
  phenoAge: PhenoAgeResult | null;
  chronologicalAge: number | null;
}

class HealthDataStoreClass {
  private data: HealthData = {
    biomarkers: {},
    bodyComp: {},
    activity: [],
    phenoAge: null,
    chronologicalAge: null,
  };

  private loaded = false;

  async loadAllData(): Promise<void> {
    const files = getDataFiles();

    let biomarkerText = '';
    let bodyCompText = '';
    const activityRows: CsvRow[] = [];

    for (const file of files) {
      if (file.type === 'bloodwork') {
        if (file.extension === '.txt') {
          biomarkerText = parseTextFile(file.path);
        } else if (file.extension === '.pdf') {
          biomarkerText = await parsePdf(file.path);
        }
      } else if (file.type === 'dexa' && file.extension === '.txt') {
        bodyCompText = parseTextFile(file.path);
      } else if (file.type === 'activity' && file.extension === '.csv') {
        const rows = parseCsv(file.path);
        activityRows.push(...rows);
      }
    }

    // Extract biomarkers
    this.data.biomarkers = extractBiomarkers(biomarkerText);

    // Get patient age from biomarkers extraction
    this.data.chronologicalAge = this.data.biomarkers.patientAge ?? null;

    // Extract body composition
    this.data.bodyComp = extractBodyComposition(bodyCompText);

    // Parse activity data
    this.data.activity = activityRows.map((row) => ({
      date: String(row.date ?? ''),
      hrv: Number(row.hrv_ms ?? 0),
      rhr: Number(row.rhr_bpm ?? 0),
      sleepHours: Number(row.sleep_hours ?? 0),
      sleepScore: row.sleep_score !== undefined ? Number(row.sleep_score) : undefined,
      strain: row.strain !== undefined ? Number(row.strain) : undefined,
    }));

    // Calculate PhenoAge if we have age and biomarkers
    if (this.data.chronologicalAge !== null) {
      this.data.phenoAge = calculatePhenoAge(
        this.data.biomarkers,
        this.data.chronologicalAge
      );
    }

    this.loaded = true;
    console.log('[HealthAI] Health data loaded successfully');
  }

  async getBiomarkers(): Promise<ExtractedBiomarkers> {
    await this.ensureLoaded();
    return this.data.biomarkers;
  }

  async getBodyComp(): Promise<BodyComposition> {
    await this.ensureLoaded();
    return this.data.bodyComp;
  }

  async getActivity(): Promise<ActivityData[]> {
    await this.ensureLoaded();
    return this.data.activity;
  }

  async getPhenoAge(): Promise<PhenoAgeResult | null> {
    await this.ensureLoaded();
    return this.data.phenoAge;
  }

  async getChronologicalAge(): Promise<number | null> {
    await this.ensureLoaded();
    return this.data.chronologicalAge;
  }

  async getHealthSummary(): Promise<string> {
    await this.ensureLoaded();

    const lines: string[] = ['=== HEALTH DATA SUMMARY ==='];

    // Age section
    if (this.data.chronologicalAge !== null) {
      lines.push(`\nChronological Age: ${this.data.chronologicalAge} years`);
      if (this.data.phenoAge) {
        lines.push(`Biological Age (PhenoAge): ${this.data.phenoAge.phenoAge} years`);
        const deltaSign = this.data.phenoAge.delta >= 0 ? '+' : '';
        lines.push(`Delta: ${deltaSign}${this.data.phenoAge.delta} years`);
      }
    }

    // Biomarkers section
    const biomarkerEntries = Object.entries(this.data.biomarkers).filter(
      ([key]) => key !== 'patientAge'
    );
    if (biomarkerEntries.length > 0) {
      lines.push('\n--- Biomarkers ---');
      for (const [key, value] of biomarkerEntries) {
        lines.push(`${formatKey(key)}: ${value}`);
      }
    }

    // Body composition section
    const bodyCompEntries = Object.entries(this.data.bodyComp);
    if (bodyCompEntries.length > 0) {
      lines.push('\n--- Body Composition ---');
      for (const [key, value] of bodyCompEntries) {
        lines.push(`${formatKey(key)}: ${value}`);
      }
    }

    // Activity section (latest or average)
    if (this.data.activity.length > 0) {
      lines.push('\n--- Activity (7-day average) ---');
      const avgHrv =
        this.data.activity.reduce((sum, d) => sum + d.hrv, 0) /
        this.data.activity.length;
      const avgRhr =
        this.data.activity.reduce((sum, d) => sum + d.rhr, 0) /
        this.data.activity.length;
      const avgSleep =
        this.data.activity.reduce((sum, d) => sum + d.sleepHours, 0) /
        this.data.activity.length;

      lines.push(`HRV: ${avgHrv.toFixed(1)} ms`);
      lines.push(`Resting Heart Rate: ${avgRhr.toFixed(1)} bpm`);
      lines.push(`Sleep: ${avgSleep.toFixed(1)} hours`);
    }

    return lines.join('\n');
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      await this.loadAllData();
    }
  }
}

function formatKey(key: string): string {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Singleton export
export const HealthDataStore = new HealthDataStoreClass();
