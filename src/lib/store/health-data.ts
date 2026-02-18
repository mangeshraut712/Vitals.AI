import path from 'path';
import { getDataFiles, TrackerType } from '@/lib/files';
import { parseTextFile } from '@/lib/parsers/text';
import { parsePdf } from '@/lib/parsers/pdf';
import { parseCsv, CsvRow } from '@/lib/parsers/csv';
import { parseWhoopFolder, WhoopData } from '@/lib/parsers/whoop';
import { parseAppleHealthExport, convertAppleHealthToActivity } from '@/lib/parsers/apple-health';
import { parseOuraExport, convertOuraToActivity } from '@/lib/parsers/oura';
import { parseFitbitExport, convertFitbitToActivity } from '@/lib/parsers/fitbit';
import { parseWithingsExport, convertWithingsToActivity } from '@/lib/parsers/withings';
import { parseSamsungExport, convertSamsungToActivity } from '@/lib/parsers/samsung-health';
import { parseGoogleFitExport, convertGoogleFitToActivity } from '@/lib/parsers/google-fit';
import { extractBiomarkers, ExtractedBiomarkers } from '@/lib/extractors/biomarkers';
import { extractBiomarkersWithAI } from '@/lib/extractors/ai-extractor';
import { extractBodyComposition, BodyComposition } from '@/lib/extractors/body-comp';
import { extractBodyCompWithAI } from '@/lib/extractors/ai-body-comp-extractor';
import { calculatePhenoAge, PhenoAgeResult } from '@/lib/calculations/phenoage';
import { calculateDerivedBiomarkers, getBiomarkerStatus } from '@/lib/biomarkers/calculations';
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
import type {
  HealthEvent,
  HealthEventQuery,
  HealthEventSeverity,
  HealthEventSource,
} from '@/lib/types/health-events';

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
  events: HealthEvent[];
}

// Map tracker type to display name
const TRACKER_DISPLAY_NAMES: Record<TrackerType, string> = {
  whoop: 'Whoop',
  apple: 'Apple Health',
  oura: 'Oura Ring',
  fitbit: 'Fitbit',
  withings: 'Withings',
  samsung: 'Samsung Health',
  google_fit: 'Google Fit',
  unknown: 'Unknown',
};

function createEmptyHealthData(): HealthData {
  return {
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
    events: [],
  };
}

class HealthDataStoreClass {
  private data: HealthData = createEmptyHealthData();

  private loaded = false;
  private loadingPromise: Promise<void> | null = null;

  async loadAllData(): Promise<void> {
    this.data = createEmptyHealthData();

    const files = getDataFiles();
    const manifest = readManifest();
    let manifestChanged = false;

    let biomarkerText = '';
    let bodyCompText = '';
    const activityRows: CsvRow[] = [];

    let usedAIExtraction = false;
    let usedAIBodyCompExtraction = false;
    let shouldRunBiomarkerRegexFallback = false;
    let shouldRunBodyCompRegexFallback = false;

    for (const file of files) {
      if (file.type === 'bloodwork') {
        // Track timestamp for bloodwork
        this.data.timestamps.bloodwork = file.lastModified ?? null;

        if (file.extension === '.txt') {
          biomarkerText = appendText(biomarkerText, parseTextFile(file.path));
        } else if (file.extension === '.pdf') {
          // Check cache before AI extraction
          const relativePath = path.relative(process.cwd(), file.path);
          const fileHash = calculateFileHash(file.path);

          if (!needsExtraction(manifest, relativePath, fileHash)) {
            // Use cached biomarkers
            const cached = readBiomarkerCache();
            if (cached && cached.sourceHash === fileHash) {
              this.data.biomarkers = this.convertCachedToExtracted(cached.biomarkers, cached.patientAge);
              console.log('[Vitals.AI] Loaded biomarkers from cache');
              usedAIExtraction = true; // Skip regex fallback
            }
          } else {
            // Extract with AI
            const pdfText = await parsePdf(file.path);
            if (pdfText) {
              try {
                const aiBiomarkers = await extractBiomarkersWithAI(pdfText);
                this.data.biomarkers = mergeExtractedBiomarkers(this.data.biomarkers, aiBiomarkers);
                usedAIExtraction = true;

                // Only cache if extraction succeeded with enough breadth.
                const biomarkerCount = aiBiomarkers.all?.length ?? 0;

                if (biomarkerCount >= 10) {
                  writeBiomarkerCache({
                    version: 1,
                    extractedAt: new Date().toISOString(),
                    sourceFile: relativePath,
                    sourceHash: fileHash,
                    patientAge: aiBiomarkers.patientAge,
                    biomarkers: this.convertExtractedToCached(aiBiomarkers),
                  });
                  updateManifestEntry(manifest, relativePath, fileHash, 'bloodwork');
                  manifestChanged = true;
                  console.log(
                    `[Vitals.AI] Biomarker extraction successful (${biomarkerCount}), cached`
                  );
                } else {
                  console.warn(
                    `[Vitals.AI] Biomarker extraction returned only ${biomarkerCount} items; using regex fallback merge`
                  );
                  shouldRunBiomarkerRegexFallback = true;
                  biomarkerText = appendText(biomarkerText, pdfText);
                }
              } catch (error) {
                console.warn(
                  '[Vitals.AI] AI biomarker extraction failed; falling back to local regex extraction',
                  error
                );
                shouldRunBiomarkerRegexFallback = true;
                biomarkerText = appendText(biomarkerText, pdfText);
              }
            }
          }
        }
      } else if (file.type === 'dexa') {
        // Track timestamp for DEXA
        this.data.timestamps.dexa = file.lastModified ?? null;

        if (file.extension === '.txt') {
          bodyCompText = appendText(bodyCompText, parseTextFile(file.path));
        } else if (file.extension === '.pdf') {
          // Check cache before AI extraction
          const relativePath = path.relative(process.cwd(), file.path);
          const fileHash = calculateFileHash(file.path);

          if (!needsExtraction(manifest, relativePath, fileHash)) {
            // Use cached body composition
            const cached = readBodyCompCache();
            if (cached && cached.sourceHash === fileHash) {
              this.data.bodyComp = cached.data;
              console.log('[Vitals.AI] Loaded body composition from cache');
              usedAIBodyCompExtraction = true; // Skip regex fallback
            }
          } else {
            // Extract with AI
            const pdfText = await parsePdf(file.path);
            if (pdfText) {
              try {
                const aiBodyComp = await extractBodyCompWithAI(pdfText);
                this.data.bodyComp = mergeBodyCompData(this.data.bodyComp, aiBodyComp);
                usedAIBodyCompExtraction = true;

                // Only cache if extraction succeeded (has meaningful data)
                if (hasMeaningfulBodyCompData(aiBodyComp)) {
                  writeBodyCompCache(aiBodyComp, relativePath, fileHash);
                  updateManifestEntry(manifest, relativePath, fileHash, 'dexa');
                  manifestChanged = true;
                  console.log('[Vitals.AI] Body comp extraction successful, cached');
                } else {
                  console.warn('[Vitals.AI] Body comp extraction returned empty; using regex fallback merge');
                  shouldRunBodyCompRegexFallback = true;
                  bodyCompText = appendText(bodyCompText, pdfText);
                }
              } catch (error) {
                console.warn(
                  '[Vitals.AI] AI body comp extraction failed; falling back to local regex extraction',
                  error
                );
                shouldRunBodyCompRegexFallback = true;
                bodyCompText = appendText(bodyCompText, pdfText);
              }
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
        } else if (file.trackerType === 'withings') {
          // Parse Withings data
          const withingsData = parseWithingsExport(file.path);
          const withingsActivity = convertWithingsToActivity(withingsData);

          for (const activity of withingsActivity) {
            activityRows.push({
              date: activity.date,
              hrv_ms: activity.hrv,
              rhr_bpm: activity.rhr,
              sleep_hours: activity.sleepHours,
              sleep_score: activity.sleepScore,
              steps: activity.steps,
            } as CsvRow);
          }

          // Extract body composition from Withings body measurements (most recent reading)
          if (withingsData.bodyMeasurements.length > 0) {
            const KG_TO_LBS = 2.20462;
            // Sort by date descending, pick most recent
            const sorted = [...withingsData.bodyMeasurements].sort((a, b) =>
              b.date.localeCompare(a.date)
            );
            const latest = sorted[0];
            const withingsBodyComp: import('@/lib/extractors/body-comp').BodyComposition = {};

            if (latest.weight !== undefined) {
              withingsBodyComp.totalMass = Math.round(latest.weight * KG_TO_LBS * 10) / 10;
            }
            if (latest.fatMassWeight !== undefined) {
              withingsBodyComp.fatMass = Math.round(latest.fatMassWeight * KG_TO_LBS * 10) / 10;
            }
            if (latest.muscleMassWeight !== undefined) {
              withingsBodyComp.leanMass = Math.round(latest.muscleMassWeight * KG_TO_LBS * 10) / 10;
            }
            if (latest.boneMassWeight !== undefined) {
              withingsBodyComp.boneMineralContent = Math.round(latest.boneMassWeight * KG_TO_LBS * 10) / 10;
            }
            if (latest.fatRatio !== undefined) {
              withingsBodyComp.bodyFatPercent = Math.round(latest.fatRatio * 10) / 10;
            } else if (latest.fatMassWeight !== undefined && latest.weight !== undefined && latest.weight > 0) {
              withingsBodyComp.bodyFatPercent = Math.round((latest.fatMassWeight / latest.weight) * 1000) / 10;
            }
            if (latest.date) {
              withingsBodyComp.scanDate = latest.date;
            }

            this.data.bodyComp = mergeBodyCompData(this.data.bodyComp, withingsBodyComp);
            console.log('[Vitals.AI] Withings body comp extracted:', withingsBodyComp);
          }
        } else if (file.trackerType === 'samsung') {
          // Parse Samsung Health data
          const samsungData = parseSamsungExport(file.path);
          const samsungActivity = convertSamsungToActivity(samsungData);

          for (const activity of samsungActivity) {
            activityRows.push({
              date: activity.date,
              hrv_ms: activity.hrv,
              rhr_bpm: activity.rhr,
              sleep_hours: activity.sleepHours,
              sleep_score: activity.sleepScore,
              steps: activity.steps,
            } as CsvRow);
          }
        } else if (file.trackerType === 'google_fit') {
          // Parse Google Fit data
          const googleFitData = parseGoogleFitExport(file.path);
          const googleFitActivity = convertGoogleFitToActivity(googleFitData);

          for (const activity of googleFitActivity) {
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

    // Extract biomarkers from text files (fallback when AI isn't available/complete)
    if (biomarkerText && (!usedAIExtraction || shouldRunBiomarkerRegexFallback)) {
      console.log('[Vitals.AI] Running regex biomarker extraction on', biomarkerText.length, 'chars');
      const localBiomarkers = extractBiomarkers(biomarkerText);
      const extractedKeys = Object.keys(localBiomarkers).filter(k => k !== 'all' && localBiomarkers[k] !== undefined);
      console.log('[Vitals.AI] Regex extracted biomarkers:', extractedKeys.length, JSON.stringify(localBiomarkers));
      this.data.biomarkers = mergeExtractedBiomarkers(this.data.biomarkers, localBiomarkers);
    }

    // Get patient age from biomarkers extraction
    this.data.chronologicalAge = this.data.biomarkers.patientAge ?? null;

    // Extract body composition from text files (fallback when AI isn't available/complete)
    if (bodyCompText && (!usedAIBodyCompExtraction || shouldRunBodyCompRegexFallback)) {
      const localBodyComp = extractBodyComposition(bodyCompText);
      this.data.bodyComp = mergeBodyCompData(this.data.bodyComp, localBodyComp);
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

    // Build normalized event feed for downstream UI/API usage
    this.data.events = this.buildHealthEvents();

    // Save manifest if changed
    if (manifestChanged) {
      writeManifest(manifest);
    }

    this.loaded = true;
    console.log('[Vitals.AI] Health data loaded successfully');
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
    // CBC differentials that have both % and absolute count variants
    const cbcDifferentials = [
      'neutrophils',
      'lymphocytes',
      'monocytes',
      'eosinophils',
      'basophils',
    ];

    const measured: CachedBiomarker[] = extracted.all.map((b) => {
      let id = normalizeBiomarkerName(b.name);

      // If this is a CBC differential with % unit, use the Percent variant
      if (cbcDifferentials.includes(id) && b.unit === '%') {
        id = `${id}Percent`;
      }

      return {
        id,
        name: b.name,
        value: b.value,
        unit: b.unit,
        referenceRange: b.referenceRange,
        labStatus: b.status,
        category: b.category,
        source: 'measured' as const,
      };
    });

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

    // Deduplicate measured biomarkers (same biomarker may appear in multiple panels)
    const uniqueMeasured: CachedBiomarker[] = [];
    const seenIds = new Set<string>();
    for (const m of measured) {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        uniqueMeasured.push(m);
      }
    }

    // Combine measured + calculated, avoiding duplicates
    // (some calculated like nonHdlC might already be in measured from lab)
    const uniqueCalculated = calculatedCached.filter((c) => !seenIds.has(c.id));

    return [...uniqueMeasured, ...uniqueCalculated];
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

  async getHealthEvents(query: HealthEventQuery = {}): Promise<HealthEvent[]> {
    await this.ensureLoaded();

    let events = [...this.data.events];

    if (query.domains && query.domains.length > 0) {
      events = events.filter((event) => query.domains?.includes(event.domain));
    }

    if (query.severities && query.severities.length > 0) {
      events = events.filter((event) => query.severities?.includes(event.severity));
    }

    const limit = Math.max(1, Math.min(query.limit ?? events.length, 200));
    return events.slice(0, limit);
  }

  private buildHealthEvents(): HealthEvent[] {
    const recordedAt = new Date().toISOString();
    const events: HealthEvent[] = [];
    const bloodworkTime = this.data.timestamps.bloodwork ?? recordedAt;
    const bodyCompTime = this.data.timestamps.dexa ?? recordedAt;
    const activityTime = this.data.timestamps.activity ?? recordedAt;
    const activitySource = toHealthEventSource(this.data.activitySource);

    // Biomarker events: prefer explicit extracted biomarkers to preserve units/status context.
    if (this.data.biomarkers.all && this.data.biomarkers.all.length > 0) {
      this.data.biomarkers.all.forEach((marker, index) => {
        const id = normalizeBiomarkerName(marker.name);
        const status = getBiomarkerStatus(id, marker.value);
        events.push({
          id: `biomarker:${id}:${index}:${bloodworkTime}`,
          domain: 'biomarker',
          severity: biomarkerStatusToSeverity(status),
          source: 'bloodwork',
          metric: marker.name,
          summary: `${marker.name} is ${statusToText(status)} at ${marker.value} ${marker.unit}`,
          value: marker.value,
          unit: marker.unit,
          status,
          occurredAt: bloodworkTime,
          recordedAt,
          confidence: marker.status ? 0.95 : 0.8,
          metadata: {
            category: marker.category ?? 'unknown',
            labStatus: marker.status ?? 'unknown',
          },
        });
      });
    } else {
      Object.entries(this.data.biomarkers).forEach(([key, rawValue], index) => {
        if (key === 'patientAge' || key === 'all' || typeof rawValue !== 'number') {
          return;
        }

        const status = getBiomarkerStatus(key, rawValue);
        events.push({
          id: `biomarker:${key}:${index}:${bloodworkTime}`,
          domain: 'biomarker',
          severity: biomarkerStatusToSeverity(status),
          source: 'bloodwork',
          metric: formatKey(key),
          summary: `${formatKey(key)} is ${statusToText(status)} at ${rawValue}`,
          value: rawValue,
          status,
          occurredAt: bloodworkTime,
          recordedAt,
          confidence: 0.75,
        });
      });
    }

    // Body composition events
    const bodyCompMetrics: Array<{
      key: keyof BodyComposition;
      label: string;
      unit: string;
      warningThreshold?: number;
      criticalThreshold?: number;
      direction?: 'higher_is_risk' | 'lower_is_risk';
    }> = [
        {
          key: 'bodyFatPercent',
          label: 'Body Fat',
          unit: '%',
          warningThreshold: 20,
          criticalThreshold: 25,
          direction: 'higher_is_risk',
        },
        {
          key: 'vatMass',
          label: 'Visceral Fat',
          unit: 'lbs',
          warningThreshold: 1.0,
          criticalThreshold: 1.5,
          direction: 'higher_is_risk',
        },
        {
          key: 'leanMass',
          label: 'Lean Mass',
          unit: 'lbs',
          warningThreshold: 120,
          criticalThreshold: 100,
          direction: 'lower_is_risk',
        },
        {
          key: 'boneDensityTScore',
          label: 'Bone Density T-Score',
          unit: '',
          warningThreshold: -1,
          criticalThreshold: -2.5,
          direction: 'lower_is_risk',
        },
      ];

    bodyCompMetrics.forEach((metric, index) => {
      const value = this.data.bodyComp[metric.key];
      if (typeof value !== 'number') return;

      let severity: HealthEventSeverity = 'info';
      if (metric.direction === 'higher_is_risk') {
        if (metric.criticalThreshold !== undefined && value >= metric.criticalThreshold) {
          severity = 'critical';
        } else if (metric.warningThreshold !== undefined && value >= metric.warningThreshold) {
          severity = 'warning';
        }
      } else if (metric.direction === 'lower_is_risk') {
        if (metric.criticalThreshold !== undefined && value <= metric.criticalThreshold) {
          severity = 'critical';
        } else if (metric.warningThreshold !== undefined && value <= metric.warningThreshold) {
          severity = 'warning';
        }
      }

      events.push({
        id: `body_comp:${metric.key}:${index}:${bodyCompTime}`,
        domain: 'body_comp',
        severity,
        source: 'dexa',
        metric: metric.label,
        summary: `${metric.label} measured at ${value}${metric.unit ? ` ${metric.unit}` : ''}`,
        value,
        unit: metric.unit,
        occurredAt: bodyCompTime,
        recordedAt,
        confidence: 0.9,
      });
    });

    // Activity events for the most recent 14 days
    const recentActivity = this.data.activity.slice(-14);
    recentActivity.forEach((entry, index) => {
      const hasSignals = entry.hrv > 0 || entry.rhr > 0 || entry.sleepHours > 0;
      if (!hasSignals) return;

      let severity: HealthEventSeverity = 'info';
      if (
        entry.hrv < 25 ||
        entry.sleepHours < 5 ||
        (entry.recovery !== undefined && entry.recovery < 40)
      ) {
        severity = 'critical';
      } else if (
        entry.hrv < 35 ||
        entry.sleepHours < 6 ||
        (entry.recovery !== undefined && entry.recovery < 60)
      ) {
        severity = 'warning';
      }

      events.push({
        id: `activity:${entry.date}:${index}:${activityTime}`,
        domain: 'activity',
        severity,
        source: activitySource,
        metric: 'Daily Recovery Snapshot',
        summary: `HRV ${entry.hrv} ms, RHR ${entry.rhr} bpm, Sleep ${entry.sleepHours.toFixed(1)}h`,
        value: entry.recovery ?? entry.sleepScore ?? null,
        unit: '%',
        occurredAt: toIsoDateOrFallback(entry.date, activityTime),
        recordedAt,
        confidence: 0.88,
        metadata: {
          strain: entry.strain ?? null,
          steps: entry.steps ?? null,
        },
      });
    });

    // Longevity event (PhenoAge delta)
    if (this.data.phenoAge && this.data.chronologicalAge !== null) {
      const delta = this.data.phenoAge.delta;
      let severity: HealthEventSeverity = 'info';
      if (delta > 5) severity = 'critical';
      else if (delta > 2) severity = 'warning';

      events.push({
        id: `longevity:phenoage:${recordedAt}`,
        domain: 'longevity',
        severity,
        source: 'bloodwork',
        metric: 'Biological Age Delta',
        summary: `PhenoAge ${this.data.phenoAge.phenoAge.toFixed(1)}y vs chronological ${this.data.chronologicalAge}y (${delta > 0 ? '+' : ''}${delta.toFixed(1)}y)`,
        value: delta,
        unit: 'years',
        occurredAt: bloodworkTime,
        recordedAt,
        confidence: 0.97,
      });
    }

    // Fallback system event if nothing has been ingested yet
    if (events.length === 0) {
      events.push({
        id: `system:no_data:${recordedAt}`,
        domain: 'system',
        severity: 'warning',
        source: 'system',
        metric: 'Data Ingestion',
        summary: 'No health data detected yet. Add files or connect a data source.',
        value: null,
        occurredAt: recordedAt,
        recordedAt,
        confidence: 1,
      });
    }

    return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
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
    if (this.loaded) return;

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.loadAllData();
    try {
      await this.loadingPromise;
    } finally {
      this.loadingPromise = null;
    }
  }
}

function appendText(existing: string, next: string): string {
  if (!next) return existing;
  if (!existing) return next;
  return `${existing}\n${next}`;
}

function mergeExtractedBiomarkers(
  primary: ExtractedBiomarkers,
  secondary: ExtractedBiomarkers
): ExtractedBiomarkers {
  const merged: ExtractedBiomarkers = { ...secondary };

  for (const [key, value] of Object.entries(primary)) {
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  const secondaryAll = secondary.all ?? [];
  const primaryAll = primary.all ?? [];

  if (secondaryAll.length > 0 || primaryAll.length > 0) {
    const deduped = new Map<string, (typeof secondaryAll)[number]>();
    for (const marker of secondaryAll) {
      deduped.set(`${normalizeBiomarkerName(marker.name)}:${marker.unit}`, marker);
    }
    for (const marker of primaryAll) {
      deduped.set(`${normalizeBiomarkerName(marker.name)}:${marker.unit}`, marker);
    }
    merged.all = Array.from(deduped.values());
  }

  return merged;
}

function hasMeaningfulBodyCompData(data: BodyComposition): boolean {
  return !!(
    data.bodyFatPercent !== undefined ||
    data.leanMass !== undefined ||
    data.fatMass !== undefined ||
    data.totalMass !== undefined ||
    data.vatMass !== undefined
  );
}

function mergeBodyCompData(primary: BodyComposition, secondary: BodyComposition): BodyComposition {
  const merged: BodyComposition = { ...secondary };

  for (const [key, value] of Object.entries(primary)) {
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  return merged;
}

function toHealthEventSource(source: TrackerType): HealthEventSource {
  if (
    source === 'whoop' ||
    source === 'apple' ||
    source === 'oura' ||
    source === 'fitbit' ||
    source === 'withings' ||
    source === 'samsung' ||
    source === 'google_fit'
  ) {
    return source;
  }
  return 'activity';
}

function biomarkerStatusToSeverity(
  status: 'optimal' | 'normal' | 'borderline' | 'out_of_range'
): HealthEventSeverity {
  if (status === 'out_of_range') return 'critical';
  if (status === 'borderline') return 'warning';
  return 'info';
}

function statusToText(status: 'optimal' | 'normal' | 'borderline' | 'out_of_range'): string {
  switch (status) {
    case 'optimal':
      return 'optimal';
    case 'normal':
      return 'in range';
    case 'borderline':
      return 'borderline';
    case 'out_of_range':
      return 'out of range';
  }
}

function toIsoDateOrFallback(value: string, fallback: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed.toISOString();
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
