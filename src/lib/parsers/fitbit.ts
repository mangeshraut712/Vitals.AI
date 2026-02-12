import fs from 'fs';
import path from 'path';
import type { ActivityData } from '@/lib/store/health-data';

/**
 * Fitbit Data Parser
 * Handles JSON exports from Google Takeout
 */

// ===== Type Definitions =====

interface FitbitSleepRecord {
  dateOfSleep: string;
  startTime: string;
  endTime: string;
  duration: number; // milliseconds
  minutesAsleep: number;
  minutesAwake: number;
  minutesToFallAsleep: number;
  timeInBed: number;
  efficiency: number;
  mainSleep: boolean;
  levels?: {
    summary?: {
      deep?: { minutes: number };
      light?: { minutes: number };
      rem?: { minutes: number };
      wake?: { minutes: number };
    };
  };
}

interface FitbitRestingHeartRateRecord {
  dateTime: string;
  value: {
    value: number;
    date: string;
  };
}

interface FitbitHrvRecord {
  dateTime: string;
  value: {
    dailyRmssd: number;
    deepRmssd: number;
  };
}

interface FitbitStepsRecord {
  dateTime: string;
  value: string | number;
}

interface FitbitActivitySummary {
  dateTime: string;
  value: {
    steps?: number;
    caloriesOut?: number;
    activeMinutes?: number;
    sedentaryMinutes?: number;
    lightlyActiveMinutes?: number;
    fairlyActiveMinutes?: number;
    veryActiveMinutes?: number;
  };
}

export interface FitbitData {
  sleeps: FitbitSleepRecord[];
  restingHeartRates: FitbitRestingHeartRateRecord[];
  hrvRecords: FitbitHrvRecord[];
  steps: FitbitStepsRecord[];
  activities: FitbitActivitySummary[];
  dateRange: { start: string | null; end: string | null };
}

// ===== Helper Functions =====

function extractDate(dateStr: string): string {
  // Fitbit dates can be in various formats
  // "2024-01-15" or "01/15/24" or "2024-01-15T08:30:00.000"
  if (!dateStr) return '';

  // ISO format
  const isoMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  // US format MM/DD/YY or MM/DD/YYYY
  const usMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
  if (usMatch) {
    const year = usMatch[3].length === 2 ? `20${usMatch[3]}` : usMatch[3];
    return `${year}-${usMatch[1]}-${usMatch[2]}`;
  }

  return '';
}

function parseJsonFile<T>(filePath: string): T[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Handle both array format and nested array
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch {
    return [];
  }
}

function findJsonFiles(folderPath: string, pattern: string): string[] {
  const results: string[] = [];

  function searchDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        searchDir(entryPath);
      } else if (entry.name.toLowerCase().includes(pattern) && entry.name.endsWith('.json')) {
        results.push(entryPath);
      }
    }
  }

  searchDir(folderPath);
  return results;
}

// ===== Main Parser =====

/**
 * Parse Fitbit data export folder (Google Takeout format)
 */
export function parseFitbitExport(folderPath: string): FitbitData {
  console.log(`[Fitbit] Parsing folder: ${folderPath}`);

  const result: FitbitData = {
    sleeps: [],
    restingHeartRates: [],
    hrvRecords: [],
    steps: [],
    activities: [],
    dateRange: { start: null, end: null },
  };

  if (!fs.existsSync(folderPath)) {
    console.warn(`[Fitbit] Folder not found: ${folderPath}`);
    return result;
  }

  // Find and parse sleep files
  const sleepFiles = findJsonFiles(folderPath, 'sleep-');
  for (const file of sleepFiles) {
    const sleeps = parseJsonFile<FitbitSleepRecord>(file);
    result.sleeps.push(...sleeps);
  }
  console.log(`[Fitbit] Parsed ${result.sleeps.length} sleep records from ${sleepFiles.length} files`);

  // Find and parse resting heart rate files
  const rhrFiles = findJsonFiles(folderPath, 'resting_heart_rate');
  for (const file of rhrFiles) {
    const rhrs = parseJsonFile<FitbitRestingHeartRateRecord>(file);
    result.restingHeartRates.push(...rhrs);
  }
  console.log(`[Fitbit] Parsed ${result.restingHeartRates.length} resting HR records`);

  // Find and parse HRV files
  const hrvFiles = findJsonFiles(folderPath, 'hrv');
  for (const file of hrvFiles) {
    const hrvs = parseJsonFile<FitbitHrvRecord>(file);
    result.hrvRecords.push(...hrvs);
  }
  console.log(`[Fitbit] Parsed ${result.hrvRecords.length} HRV records`);

  // Find and parse steps files
  const stepsFiles = findJsonFiles(folderPath, 'steps');
  for (const file of stepsFiles) {
    const steps = parseJsonFile<FitbitStepsRecord>(file);
    result.steps.push(...steps);
  }
  console.log(`[Fitbit] Parsed ${result.steps.length} steps records`);

  // Find and parse activity summary files
  const activityFiles = findJsonFiles(folderPath, 'activity');
  for (const file of activityFiles) {
    // Skip if it's a specific activity type file
    if (file.toLowerCase().includes('exercise') || file.toLowerCase().includes('workout')) {
      continue;
    }
    const activities = parseJsonFile<FitbitActivitySummary>(file);
    result.activities.push(...activities);
  }
  console.log(`[Fitbit] Parsed ${result.activities.length} activity records`);

  // Calculate date range
  const allDates = [
    ...result.sleeps.map((s) => extractDate(s.dateOfSleep)),
    ...result.restingHeartRates.map((r) => extractDate(r.dateTime)),
    ...result.steps.map((s) => extractDate(s.dateTime)),
  ].filter((d) => d);

  if (allDates.length > 0) {
    allDates.sort();
    result.dateRange.start = allDates[0];
    result.dateRange.end = allDates[allDates.length - 1];
  }

  console.log(`[Fitbit] Date range: ${result.dateRange.start} to ${result.dateRange.end}`);

  return result;
}

/**
 * Convert Fitbit data to ActivityData format
 */
export function convertFitbitToActivity(fitbitData: FitbitData): ActivityData[] {
  // Create a map of date -> ActivityData
  const dataByDate = new Map<string, ActivityData>();

  // Process sleep data
  for (const sleep of fitbitData.sleeps) {
    // Only use main sleep records
    if (!sleep.mainSleep) continue;

    const date = extractDate(sleep.dateOfSleep);
    if (!date) continue;

    const existing = dataByDate.get(date) || {
      date,
      hrv: 0,
      rhr: 0,
      sleepHours: 0,
      sleepScore: undefined,
      sleepConsistency: undefined,
      strain: undefined,
      recovery: undefined,
      steps: undefined,
    };

    existing.sleepHours = Math.round((sleep.minutesAsleep / 60) * 10) / 10;
    existing.sleepScore = sleep.efficiency;

    dataByDate.set(date, existing);
  }

  // Add resting heart rate
  for (const rhr of fitbitData.restingHeartRates) {
    const date = extractDate(rhr.dateTime);
    if (!date) continue;

    const existing = dataByDate.get(date);
    if (existing) {
      existing.rhr = rhr.value.value;
    } else {
      dataByDate.set(date, {
        date,
        hrv: 0,
        rhr: rhr.value.value,
        sleepHours: 0,
        sleepScore: undefined,
        sleepConsistency: undefined,
        strain: undefined,
        recovery: undefined,
        steps: undefined,
      });
    }
  }

  // Add HRV data
  for (const hrv of fitbitData.hrvRecords) {
    const date = extractDate(hrv.dateTime);
    if (!date) continue;

    const existing = dataByDate.get(date);
    if (existing) {
      // Use dailyRmssd as HRV value
      existing.hrv = Math.round(hrv.value.dailyRmssd || hrv.value.deepRmssd || 0);
    }
  }

  // Aggregate steps by date
  const stepsByDate = new Map<string, number>();
  for (const step of fitbitData.steps) {
    const date = extractDate(step.dateTime);
    if (!date) continue;

    const value = typeof step.value === 'string' ? parseInt(step.value, 10) : step.value;
    const current = stepsByDate.get(date) || 0;
    stepsByDate.set(date, current + (value || 0));
  }

  // Add steps to activity data
  for (const [date, steps] of stepsByDate) {
    const existing = dataByDate.get(date);
    if (existing) {
      existing.steps = steps;
    } else {
      dataByDate.set(date, {
        date,
        hrv: 0,
        rhr: 0,
        sleepHours: 0,
        sleepScore: undefined,
        sleepConsistency: undefined,
        strain: undefined,
        recovery: undefined,
        steps,
      });
    }
  }

  // Convert to array and sort
  const activityData = Array.from(dataByDate.values());
  activityData.sort((a, b) => a.date.localeCompare(b.date));

  return activityData;
}

/**
 * Check if a folder contains Fitbit export data
 */
export function isFitbitFolder(folderPath: string): boolean {
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return false;
  }

  // Check for characteristic Fitbit files
  const files = fs.readdirSync(folderPath);
  const hasFitbitFiles = files.some(
    (f) =>
      f.toLowerCase().startsWith('sleep-') ||
      f.toLowerCase().startsWith('heart_rate-') ||
      f.toLowerCase().startsWith('steps-') ||
      f.toLowerCase().includes('fitbit')
  );

  if (hasFitbitFiles) return true;

  // Check subdirectories (Google Takeout nests files)
  for (const file of files) {
    const subPath = path.join(folderPath, file);
    if (fs.statSync(subPath).isDirectory()) {
      const subFiles = fs.readdirSync(subPath);
      if (
        subFiles.some(
          (f) =>
            f.toLowerCase().startsWith('sleep-') ||
            f.toLowerCase().startsWith('heart_rate-') ||
            f.toLowerCase().startsWith('steps-')
        )
      ) {
        return true;
      }
    }
  }

  return false;
}
