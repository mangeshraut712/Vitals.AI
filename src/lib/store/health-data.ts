import path from 'path';
import { getDataFiles, TrackerType } from '@/lib/files';
import { parseTextFile } from '@/lib/parsers/text';
import { parsePdf } from '@/lib/parsers/pdf';
import { parseCsv, CsvRow } from '@/lib/parsers/csv';
import { parseWhoopFolder, WhoopData } from '@/lib/parsers/whoop';
import { parseAppleHealthExport, convertAppleHealthToActivity } from '@/lib/parsers/apple-health';
import { parseOuraExport, convertOuraToActivity } from '@/lib/parsers/oura';
import { parseFitbitExport, convertFitbitToActivity } from '@/lib/parsers/fitbit';
import { extractBiomarkers, ExtractedBiomarkers } from '@/lib/extractors/biomarkers';
import { extractBiomarkersWithAI } from '@/lib/extractors/ai-extractor';
import { extractBodyComposition, BodyComposition } from '@/lib/extractors/body-comp';
import { extractBodyCompWithAI } from '@/lib/extractors/ai-body-comp-extractor';
import { calculatePhenoAge, PhenoAgeResult } from '@/lib/calculations/phenoage';
import { calculateDerivedBiomarkers } from '@/lib/biomarkers/calculations';
import {
  calculateFileHash,
  readManifest,
  writeManifest,
  needsExtraction,
  updateManifestEntry,
  readBiomarkerCache,
  writeBiomarkerCache,
  readBodyCompCache,
  writeBodyCompCache,
  normalizeBiomarkerName,
  type CachedBiomarker,
} from '@/lib/cache';

export interface ActivityData {
  date: string;
  hrv: number;
  rhr: number;
  sleepHours: number;
  sleepScore?: number;
  sleepConsistency?: number; // Sleep consistency percentage (0-100)
  strain?: number;
  recovery?: number; // Recovery percentage (0-100)
  steps?: number; // Daily step count
}

export interface DataSourceTimestamps {
  bloodwork: string | null;
  dexa: string | null;
  activity: string | null;
}

export interface HealthData {
  biomarkers: ExtractedBiomarkers;
  bodyComp: BodyComposition;
  activity: ActivityData[];
  activitySource: TrackerType;
  whoop: WhoopData | null;
  phenoAge: PhenoAgeResult | null;
  chronologicalAge: number | null;
  timestamps: DataSourceTimestamps;
}

// Map tracker type to display name
const TRACKER_DISPLAY_NAMES: Record<TrackerType, string> = {
  whoop: 'Whoop',
  apple: 'Apple Health',
  oura: 'Oura Ring',
  fitbit: 'Fitbit',
  unknown: 'Unknown',
};

class HealthDataStoreClass {
  private data: HealthData = {
    biomarkers: {},
    bodyComp: {},
    activity: [],
    activitySource: 'unknown',
    whoop: null,
    phenoAge: null,
    chronologicalAge: null,
    timestamps: {
      bloodwork: null,
      dexa: null,
      activity: null,
    },
  };

  private loaded = false;

  async loadAllData(): Promise<void> {
    const files = getDataFiles();
    const manifest = readManifest();
    let manifestChanged = false;

    let biomarkerText = '';
    let bodyCompText = '';
    const activityRows: CsvRow[] = [];

    let usedAIExtraction = false;
    let usedAIBodyCompExtraction = false;

    for (const file of files) {
      if (file.type === 'bloodwork') {
        // Track timestamp for bloodwork
        this.data.timestamps.bloodwork = file.lastModified ?? null;

        if (file.extension === '.txt') {
          biomarkerText = parseTextFile(file.path);
        } else if (file.extension === '.pdf') {
          // Check cache before AI extraction
          const relativePath = path.relative(process.cwd(), file.path);
          const fileHash = calculateFileHash(file.path);

          if (!needsExtraction(manifest, relativePath, fileHash)) {
            // Use cached biomarkers
            const cached = readBiomarkerCache();
            if (cached && cached.sourceHash === fileHash) {
              this.data.biomarkers = this.convertCachedToExtracted(cached.biomarkers, cached.patientAge);
              console.log('[HealthAI] Loaded biomarkers from cache');
              usedAIExtraction = true; // Skip regex fallback
            }
          } else {
            // Extract with AI
            const pdfText = await parsePdf(file.path);
            if (pdfText) {
              this.data.biomarkers = await extractBiomarkersWithAI(pdfText);
              usedAIExtraction = true;

              // Save to cache
              writeBiomarkerCache({
                version: 1,
                extractedAt: new Date().toISOString(),
                sourceFile: relativePath,
                sourceHash: fileHash,
                patientAge: this.data.biomarkers.patientAge,
                biomarkers: this.convertExtractedToCached(this.data.biomarkers),
              });
              updateManifestEntry(manifest, relativePath, fileHash, 'bloodwork');
              manifestChanged = true;
            }
          }
        }
      } else if (file.type === 'dexa') {
        // Track timestamp for DEXA
        this.data.timestamps.dexa = file.lastModified ?? null;

        if (file.extension === '.txt') {
          bodyCompText = parseTextFile(file.path);
        } else if (file.extension === '.pdf') {
          // Check cache before AI extraction
          const relativePath = path.relative(process.cwd(), file.path);
          const fileHash = calculateFileHash(file.path);

          if (!needsExtraction(manifest, relativePath, fileHash)) {
            // Use cached body composition
            const cached = readBodyCompCache();
            if (cached && cached.sourceHash === fileHash) {
              this.data.bodyComp = cached.data;
              console.log('[HealthAI] Loaded body composition from cache');
              usedAIBodyCompExtraction = true; // Skip regex fallback
            }
          } else {
            // Extract with AI
            const pdfText = await parsePdf(file.path);
            if (pdfText) {
              this.data.bodyComp = await extractBodyCompWithAI(pdfText);
              usedAIBodyCompExtraction = true;

              // Save to cache
              writeBodyCompCache(this.data.bodyComp, relativePath, fileHash);
              updateManifestEntry(manifest, relativePath, fileHash, 'dexa');
              manifestChanged = true;
            }
          }
        }
      } else if (file.type === 'activity' && file.extension === '.csv') {
        // Track timestamp for activity
        this.data.timestamps.activity = file.lastModified ?? null;
        const rows = parseCsv(file.path);
        activityRows.push(...rows);
      } else if (file.type === 'activity_folder' && file.isFolder) {
        // Handle folder-based data exports based on tracker type
        this.data.timestamps.activity = file.lastModified ?? null;
        this.data.activitySource = file.trackerType ?? 'unknown';

        if (file.trackerType === 'whoop') {
          // Parse Whoop data
          const whoopData = parseWhoopFolder(file.path);
          this.data.whoop = whoopData;

          // Convert Whoop cycles to ActivityData for compatibility with existing UI
          for (const cycle of whoopData.cycles) {
            if (!cycle.date) continue;

            // Convert sleep duration from minutes to hours
            const sleepHours = cycle.asleepDuration ? cycle.asleepDuration / 60 : 0;

            activityRows.push({
              date: cycle.date,
              hrv_ms: cycle.hrv ?? 0,
              rhr_bpm: cycle.restingHeartRate ?? 0,
              sleep_hours: sleepHours,
              sleep_score: cycle.sleepPerformance ?? undefined,
              sleep_consistency: cycle.sleepConsistency ?? undefined,
              strain: cycle.dayStrain ?? undefined,
              recovery: cycle.recoveryScore ?? undefined,
            } as CsvRow);
          }
        } else if (file.trackerType === 'apple') {
          // Parse Apple Health data
          const appleData = parseAppleHealthExport(file.path);
          const appleActivity = convertAppleHealthToActivity(appleData);

          // Convert to CsvRow format for consistency
          for (const activity of appleActivity) {
            activityRows.push({
              date: activity.date,
              hrv_ms: activity.hrv,
              rhr_bpm: activity.rhr,
              sleep_hours: activity.sleepHours,
              sleep_score: activity.sleepScore,
              steps: activity.steps,
            } as CsvRow);
          }
        } else if (file.trackerType === 'oura') {
          // Parse Oura data
          const ouraData = parseOuraExport(file.path);
          const ouraActivity = convertOuraToActivity(ouraData);

          // Convert to CsvRow format for consistency
          for (const activity of ouraActivity) {
            activityRows.push({
              date: activity.date,
              hrv_ms: activity.hrv,
              rhr_bpm: activity.rhr,
              sleep_hours: activity.sleepHours,
              sleep_score: activity.sleepScore,
              recovery: activity.recovery,
              steps: activity.steps,
            } as CsvRow);
          }
        } else if (file.trackerType === 'fitbit') {
          // Parse Fitbit data
          const fitbitData = parseFitbitExport(file.path);
          const fitbitActivity = convertFitbitToActivity(fitbitData);

          // Convert to CsvRow format for consistency
          for (const activity of fitbitActivity) {
            activityRows.push({
              date: activity.date,
              hrv_ms: activity.hrv,
              rhr_bpm: activity.rhr,
              sleep_hours: activity.sleepHours,
              sleep_score: activity.sleepScore,
              steps: activity.steps,
            } as CsvRow);
          }
        }
      }
    }

    // Extract biomarkers from text files (fallback to regex if AI wasn't used)
    if (!usedAIExtraction && biomarkerText) {
      this.data.biomarkers = extractBiomarkers(biomarkerText);
    }

    // Get patient age from biomarkers extraction
    this.data.chronologicalAge = this.data.biomarkers.patientAge ?? null;

    // Extract body composition (fallback to regex if AI wasn't used)
    if (!usedAIBodyCompExtraction && bodyCompText) {
      this.data.bodyComp = extractBodyComposition(bodyCompText);
    }

    // Parse activity data
    this.data.activity = activityRows.map((row) => ({
      date: String(row.date ?? ''),
      hrv: Number(row.hrv_ms ?? 0),
      rhr: Number(row.rhr_bpm ?? 0),
      sleepHours: Number(row.sleep_hours ?? 0),
      sleepScore: row.sleep_score !== undefined ? Number(row.sleep_score) : undefined,
      sleepConsistency:
        row.sleep_consistency !== undefined ? Number(row.sleep_consistency) : undefined,
      strain: row.strain !== undefined ? Number(row.strain) : undefined,
      recovery: row.recovery !== undefined ? Number(row.recovery) : undefined,
      steps: row.steps !== undefined ? Number(row.steps) : undefined,
    }));

    // Calculate PhenoAge if we have age and biomarkers
    if (this.data.chronologicalAge !== null) {
      this.data.phenoAge = calculatePhenoAge(this.data.biomarkers, this.data.chronologicalAge);
    }

    // Save manifest if changed
    if (manifestChanged) {
      writeManifest(manifest);
    }

    this.loaded = true;
    console.log('[HealthAI] Health data loaded successfully');
  }

  /**
   * Convert cached biomarkers back to ExtractedBiomarkers format
   */
  private convertCachedToExtracted(
    cached: CachedBiomarker[],
    patientAge?: number
  ): ExtractedBiomarkers {
    const result: ExtractedBiomarkers = {
      patientAge,
      all: cached.map((b) => ({
        name: b.name,
        value: b.value,
        unit: b.unit,
        referenceRange: b.referenceRange,
        status: b.labStatus,
        category: b.category,
      })),
    };

    // Map to known keys for calculations
    for (const biomarker of cached) {
      (result as Record<string, unknown>)[biomarker.id] = biomarker.value;
    }

    return result;
  }

  /**
   * Convert extracted biomarkers to cached format, including calculated biomarkers
   */
  private convertExtractedToCached(extracted: ExtractedBiomarkers): CachedBiomarker[] {
    if (!extracted.all) return [];

    // Convert measured biomarkers
    const measured: CachedBiomarker[] = extracted.all.map((b) => ({
      id: normalizeBiomarkerName(b.name),
      name: b.name,
      value: b.value,
      unit: b.unit,
      referenceRange: b.referenceRange,
      labStatus: b.status,
      category: b.category,
      source: 'measured' as const,
    }));

    // Build raw values map for calculations
    const rawValues: Record<string, number> = {};
    for (const m of measured) {
      rawValues[m.id] = m.value;
    }

    // Calculate derived biomarkers
    const calculated = calculateDerivedBiomarkers(rawValues);
    const calculatedCached: CachedBiomarker[] = calculated.map((c) => ({
      id: c.id,
      name: c.name,
      value: c.value,
      unit: c.unit,
      referenceRange: undefined,
      labStatus: undefined,
      category: 'Calculated',
      source: 'calculated' as const,
    }));

    // Combine measured + calculated, avoiding duplicates
    // (some calculated like nonHdlC might already be in measured from lab)
    const measuredIds = new Set(measured.map((m) => m.id));
    const uniqueCalculated = calculatedCached.filter((c) => !measuredIds.has(c.id));

    return [...measured, ...uniqueCalculated];
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

  async getActivitySource(): Promise<TrackerType> {
    await this.ensureLoaded();
    return this.data.activitySource;
  }

  async getWhoopData(): Promise<WhoopData | null> {
    await this.ensureLoaded();
    return this.data.whoop;
  }

  async getPhenoAge(): Promise<PhenoAgeResult | null> {
    await this.ensureLoaded();
    return this.data.phenoAge;
  }

  async getChronologicalAge(): Promise<number | null> {
    await this.ensureLoaded();
    return this.data.chronologicalAge;
  }

  async getTimestamps(): Promise<DataSourceTimestamps> {
    await this.ensureLoaded();
    return this.data.timestamps;
  }

  async getHealthSummary(): Promise<string> {
    await this.ensureLoaded();

    const lines: string[] = ['=== HEALTH DATA SUMMARY ==='];

    // Activity data source
    if (this.data.activitySource !== 'unknown') {
      lines.push(`\nActivity Data Source: ${TRACKER_DISPLAY_NAMES[this.data.activitySource]}`);
    }

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

    // Body composition section (DEXA scan data)
    const bc = this.data.bodyComp;
    if (Object.keys(bc).length > 0) {
      lines.push('\n--- Body Composition (DEXA Scan) ---');

      // Primary metrics
      if (bc.bodyFatPercent !== undefined) lines.push(`Body Fat: ${bc.bodyFatPercent}%`);
      if (bc.leanMass !== undefined) lines.push(`Lean Mass: ${bc.leanMass} lbs`);
      if (bc.fatMass !== undefined) lines.push(`Fat Mass: ${bc.fatMass} lbs`);
      if (bc.totalMass !== undefined) lines.push(`Total Mass: ${bc.totalMass} lbs`);
      if (bc.boneMineralContent !== undefined)
        lines.push(`Bone Mineral Content: ${bc.boneMineralContent} lbs`);

      // Visceral fat (important health marker)
      if (bc.vatMass !== undefined || bc.visceralFat !== undefined) {
        lines.push(`Visceral Fat (VAT): ${bc.vatMass ?? bc.visceralFat} lbs`);
      }
      if (bc.vatVolume !== undefined) lines.push(`VAT Volume: ${bc.vatVolume} in³`);

      // Regional fat distribution
      if (bc.androidFatPercent !== undefined || bc.gynoidFatPercent !== undefined) {
        lines.push('\nRegional Fat Distribution:');
        if (bc.armsFatPercent !== undefined) lines.push(`  Arms: ${bc.armsFatPercent}%`);
        if (bc.legsFatPercent !== undefined) lines.push(`  Legs: ${bc.legsFatPercent}%`);
        if (bc.trunkFatPercent !== undefined) lines.push(`  Trunk: ${bc.trunkFatPercent}%`);
        if (bc.androidFatPercent !== undefined)
          lines.push(`  Android (abdominal): ${bc.androidFatPercent}%`);
        if (bc.gynoidFatPercent !== undefined)
          lines.push(`  Gynoid (hip/thigh): ${bc.gynoidFatPercent}%`);
        if (bc.agRatio !== undefined) lines.push(`  A/G Ratio: ${bc.agRatio} (target: < 1.0)`);
      }

      // Metabolic
      if (bc.restingMetabolicRate !== undefined) {
        lines.push(`\nResting Metabolic Rate: ${bc.restingMetabolicRate} cal/day`);
      }

      // Bone density
      if (bc.boneDensityTScore !== undefined || bc.boneDensityZScore !== undefined) {
        lines.push('\nBone Density:');
        if (bc.totalBmd !== undefined) lines.push(`  Total BMD: ${bc.totalBmd} g/cm²`);
        if (bc.boneDensityTScore !== undefined) lines.push(`  T-Score: ${bc.boneDensityTScore}`);
        if (bc.boneDensityZScore !== undefined) lines.push(`  Z-Score: ${bc.boneDensityZScore}`);
      }
    }

    // Activity section (latest or average)
    if (this.data.activity.length > 0) {
      const recentDays = 7;
      const recentActivity = this.data.activity.slice(-recentDays);
      lines.push(`\n--- Activity (${recentDays}-day average) ---`);

      const avgHrv = recentActivity.reduce((sum, d) => sum + d.hrv, 0) / recentActivity.length;
      const avgRhr = recentActivity.reduce((sum, d) => sum + d.rhr, 0) / recentActivity.length;
      const avgSleep =
        recentActivity.reduce((sum, d) => sum + d.sleepHours, 0) / recentActivity.length;

      lines.push(`HRV: ${avgHrv.toFixed(1)} ms`);
      lines.push(`Resting Heart Rate: ${avgRhr.toFixed(1)} bpm`);
      lines.push(`Sleep: ${avgSleep.toFixed(1)} hours`);

      // Recovery if available
      const recoveryValues = recentActivity.filter((d) => d.recovery !== undefined);
      if (recoveryValues.length > 0) {
        const avgRecovery =
          recoveryValues.reduce((sum, d) => sum + (d.recovery ?? 0), 0) / recoveryValues.length;
        lines.push(`Recovery: ${avgRecovery.toFixed(0)}%`);
      }

      // Strain if available (mainly Whoop)
      const strainValues = recentActivity.filter((d) => d.strain !== undefined);
      if (strainValues.length > 0) {
        const avgStrain =
          strainValues.reduce((sum, d) => sum + (d.strain ?? 0), 0) / strainValues.length;
        lines.push(`Strain: ${avgStrain.toFixed(1)}`);
      }

      // Steps if available
      const stepsValues = recentActivity.filter((d) => d.steps !== undefined);
      if (stepsValues.length > 0) {
        const avgSteps =
          stepsValues.reduce((sum, d) => sum + (d.steps ?? 0), 0) / stepsValues.length;
        lines.push(`Steps: ${Math.round(avgSteps).toLocaleString()}`);
      }
    }

    // Whoop workouts section (only if using Whoop)
    if (this.data.whoop && this.data.whoop.workouts.length > 0) {
      const recentWorkouts = this.data.whoop.workouts.slice(-10);
      lines.push(`\n--- Recent Workouts (${recentWorkouts.length}) ---`);
      for (const workout of recentWorkouts) {
        const strainStr = workout.activityStrain
          ? ` (strain: ${workout.activityStrain.toFixed(1)})`
          : '';
        lines.push(`${workout.date}: ${workout.activityName} - ${workout.duration}min${strainStr}`);
      }
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

// Singleton export (use global to persist in Next.js dev mode)
const globalForHealthData = globalThis as unknown as {
  healthDataStore: HealthDataStoreClass | undefined;
};

export const HealthDataStore =
  globalForHealthData.healthDataStore ?? new HealthDataStoreClass();

if (process.env.NODE_ENV !== 'production') {
  globalForHealthData.healthDataStore = HealthDataStore;
}
