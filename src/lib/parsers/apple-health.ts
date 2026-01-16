import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import type { ActivityData } from '@/lib/store/health-data';

/**
 * Apple Health Data Parser
 * Parses the export.xml file from Apple Health exports
 */

// ===== Type Definitions =====

interface AppleHealthRecord {
  '@_type': string;
  '@_value'?: string;
  '@_unit'?: string;
  '@_sourceName'?: string;
  '@_startDate': string;
  '@_endDate': string;
  '@_creationDate'?: string;
}

interface AppleHealthWorkout {
  '@_workoutActivityType': string;
  '@_duration': string;
  '@_durationUnit': string;
  '@_totalEnergyBurned'?: string;
  '@_totalEnergyBurnedUnit'?: string;
  '@_startDate': string;
  '@_endDate': string;
}

interface AppleHealthExport {
  HealthData?: {
    Record?: AppleHealthRecord | AppleHealthRecord[];
    Workout?: AppleHealthWorkout | AppleHealthWorkout[];
  };
}

export interface AppleHealthData {
  dailyData: Map<string, DailyAppleHealthData>;
  workouts: ParsedAppleWorkout[];
  dateRange: { start: string | null; end: string | null };
}

interface DailyAppleHealthData {
  date: string;
  hrvValues: number[];
  rhrValues: number[];
  sleepMinutes: number;
  steps: number;
  activeCalories: number;
}

interface ParsedAppleWorkout {
  date: string;
  activityType: string;
  duration: number; // minutes
  energyBurned: number | null;
  startDate: string;
  endDate: string;
}

// ===== Helper Functions =====

function extractDate(dateStr: string): string {
  // Apple Health dates are in format: "2024-01-15 08:30:00 -0800"
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function parseAppleActivityType(type: string): string {
  // Convert HKWorkoutActivityType to readable name
  const typeMap: Record<string, string> = {
    HKWorkoutActivityTypeRunning: 'Running',
    HKWorkoutActivityTypeWalking: 'Walking',
    HKWorkoutActivityTypeCycling: 'Cycling',
    HKWorkoutActivityTypeSwimming: 'Swimming',
    HKWorkoutActivityTypeYoga: 'Yoga',
    HKWorkoutActivityTypeStrengthTraining: 'Strength Training',
    HKWorkoutActivityTypeFunctionalStrengthTraining: 'Functional Strength',
    HKWorkoutActivityTypeHighIntensityIntervalTraining: 'HIIT',
    HKWorkoutActivityTypeElliptical: 'Elliptical',
    HKWorkoutActivityTypeRowing: 'Rowing',
    HKWorkoutActivityTypePilates: 'Pilates',
    HKWorkoutActivityTypeDance: 'Dance',
    HKWorkoutActivityTypeHiking: 'Hiking',
    HKWorkoutActivityTypeCoreTraining: 'Core Training',
  };

  return typeMap[type] || type.replace('HKWorkoutActivityType', '');
}

// ===== Main Parser =====

/**
 * Parse Apple Health export.xml file
 */
export function parseAppleHealthExport(folderPath: string): AppleHealthData {
  console.log(`[Apple Health] Parsing folder: ${folderPath}`);

  const result: AppleHealthData = {
    dailyData: new Map(),
    workouts: [],
    dateRange: { start: null, end: null },
  };

  // Find export.xml
  const exportFile = path.join(folderPath, 'export.xml');
  if (!fs.existsSync(exportFile)) {
    console.warn(`[Apple Health] export.xml not found in ${folderPath}`);
    return result;
  }

  try {
    console.log('[Apple Health] Reading export.xml (this may take a moment for large files)...');
    const xmlContent = fs.readFileSync(exportFile, 'utf-8');

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
    });

    const parsed: AppleHealthExport = parser.parse(xmlContent);

    if (!parsed.HealthData) {
      console.warn('[Apple Health] No HealthData found in export');
      return result;
    }

    // Process records
    const records = parsed.HealthData.Record;
    if (records) {
      const recordArray = Array.isArray(records) ? records : [records];
      console.log(`[Apple Health] Processing ${recordArray.length} records...`);

      for (const record of recordArray) {
        processRecord(record, result.dailyData);
      }
    }

    // Process workouts
    const workouts = parsed.HealthData.Workout;
    if (workouts) {
      const workoutArray = Array.isArray(workouts) ? workouts : [workouts];
      console.log(`[Apple Health] Processing ${workoutArray.length} workouts...`);

      for (const workout of workoutArray) {
        const date = extractDate(workout['@_startDate']);
        if (!date) continue;

        result.workouts.push({
          date,
          activityType: parseAppleActivityType(workout['@_workoutActivityType']),
          duration: parseFloat(workout['@_duration']) || 0,
          energyBurned: workout['@_totalEnergyBurned']
            ? parseFloat(workout['@_totalEnergyBurned'])
            : null,
          startDate: workout['@_startDate'],
          endDate: workout['@_endDate'],
        });
      }
    }

    // Calculate date range
    const allDates = Array.from(result.dailyData.keys()).sort();
    if (allDates.length > 0) {
      result.dateRange.start = allDates[0];
      result.dateRange.end = allDates[allDates.length - 1];
    }

    console.log(
      `[Apple Health] Parsed ${result.dailyData.size} days of data, ${result.workouts.length} workouts`
    );
    console.log(`[Apple Health] Date range: ${result.dateRange.start} to ${result.dateRange.end}`);
  } catch (error) {
    console.error('[Apple Health] Error parsing export:', error);
  }

  return result;
}

function processRecord(record: AppleHealthRecord, dailyData: Map<string, DailyAppleHealthData>): void {
  const type = record['@_type'];
  const date = extractDate(record['@_startDate']);

  if (!date || !type) return;

  // Get or create daily record
  if (!dailyData.has(date)) {
    dailyData.set(date, {
      date,
      hrvValues: [],
      rhrValues: [],
      sleepMinutes: 0,
      steps: 0,
      activeCalories: 0,
    });
  }

  const daily = dailyData.get(date)!;
  const value = record['@_value'] ? parseFloat(record['@_value']) : 0;

  switch (type) {
    case 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN':
      if (value > 0) {
        daily.hrvValues.push(value);
      }
      break;

    case 'HKQuantityTypeIdentifierRestingHeartRate':
      if (value > 0) {
        daily.rhrValues.push(value);
      }
      break;

    case 'HKCategoryTypeIdentifierSleepAnalysis':
      // Sleep records have start and end times
      // Value 1 = InBed, 2 = Asleep, 3 = Awake
      if (record['@_value'] === '2' || record['@_value'] === 'HKCategoryValueSleepAnalysisAsleep') {
        const start = new Date(record['@_startDate']);
        const end = new Date(record['@_endDate']);
        const durationMin = (end.getTime() - start.getTime()) / (1000 * 60);
        if (durationMin > 0 && durationMin < 1440) {
          // Max 24 hours
          daily.sleepMinutes += durationMin;
        }
      }
      break;

    case 'HKQuantityTypeIdentifierStepCount':
      if (value > 0) {
        daily.steps += value;
      }
      break;

    case 'HKQuantityTypeIdentifierActiveEnergyBurned':
      if (value > 0) {
        daily.activeCalories += value;
      }
      break;
  }
}

/**
 * Convert Apple Health data to ActivityData format
 */
export function convertAppleHealthToActivity(appleData: AppleHealthData): ActivityData[] {
  const activityData: ActivityData[] = [];

  for (const [date, daily] of appleData.dailyData) {
    // Calculate averages
    const avgHrv =
      daily.hrvValues.length > 0
        ? daily.hrvValues.reduce((a, b) => a + b, 0) / daily.hrvValues.length
        : 0;

    const avgRhr =
      daily.rhrValues.length > 0
        ? daily.rhrValues.reduce((a, b) => a + b, 0) / daily.rhrValues.length
        : 0;

    const sleepHours = daily.sleepMinutes / 60;

    activityData.push({
      date,
      hrv: Math.round(avgHrv),
      rhr: Math.round(avgRhr),
      sleepHours: Math.round(sleepHours * 10) / 10,
      steps: Math.round(daily.steps),
      // Apple Health doesn't have direct equivalents for these
      sleepScore: undefined,
      sleepConsistency: undefined,
      strain: undefined,
      recovery: undefined,
    });
  }

  // Sort by date
  activityData.sort((a, b) => a.date.localeCompare(b.date));

  return activityData;
}

/**
 * Check if a folder contains Apple Health export
 */
export function isAppleHealthExport(folderPath: string): boolean {
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return false;
  }

  const files = fs.readdirSync(folderPath);
  return files.some(
    (f) => f.toLowerCase() === 'export.xml' || f.toLowerCase() === 'export.zip'
  );
}
