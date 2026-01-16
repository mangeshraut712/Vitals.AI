import fs from 'fs';
import path from 'path';
import { parseCsv, CsvRow } from './csv';

/**
 * Whoop Data Parser
 * Handles the folder-based export format from Whoop with multiple CSV files
 */

// ===== Type Definitions =====

export interface WhoopCycle {
  date: string; // YYYY-MM-DD
  cycleStart: string;
  cycleEnd: string | null;
  timezone: string;

  // Recovery
  recoveryScore: number | null;
  restingHeartRate: number | null;
  hrv: number | null;
  skinTemp: number | null;
  bloodOxygen: number | null;

  // Strain
  dayStrain: number | null;
  energyBurned: number | null;
  maxHr: number | null;
  avgHr: number | null;

  // Sleep (from cycle)
  sleepOnset: string | null;
  wakeOnset: string | null;
  sleepPerformance: number | null;
  respiratoryRate: number | null;
  asleepDuration: number | null; // minutes
  inBedDuration: number | null; // minutes
  lightSleepDuration: number | null;
  deepSleepDuration: number | null;
  remDuration: number | null;
  awakeDuration: number | null;
  sleepNeed: number | null;
  sleepDebt: number | null;
  sleepEfficiency: number | null;
  sleepConsistency: number | null;
}

export interface WhoopSleep {
  date: string;
  cycleStart: string;
  sleepOnset: string;
  wakeOnset: string;
  sleepPerformance: number | null;
  respiratoryRate: number | null;
  asleepDuration: number | null;
  inBedDuration: number | null;
  lightSleepDuration: number | null;
  deepSleepDuration: number | null;
  remDuration: number | null;
  awakeDuration: number | null;
  sleepNeed: number | null;
  sleepDebt: number | null;
  sleepEfficiency: number | null;
  sleepConsistency: number | null;
  isNap: boolean;
}

export interface WhoopWorkout {
  date: string;
  cycleStart: string;
  workoutStart: string;
  workoutEnd: string;
  duration: number; // minutes
  activityName: string;
  activityStrain: number | null;
  energyBurned: number | null;
  maxHr: number | null;
  avgHr: number | null;
  hrZone1: number | null;
  hrZone2: number | null;
  hrZone3: number | null;
  hrZone4: number | null;
  hrZone5: number | null;
  gpsEnabled: boolean;
}

export interface WhoopJournalEntry {
  date: string;
  cycleStart: string;
  question: string;
  answeredYes: boolean;
  notes: string | null;
}

export interface WhoopData {
  cycles: WhoopCycle[];
  sleeps: WhoopSleep[];
  workouts: WhoopWorkout[];
  journalEntries: WhoopJournalEntry[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

// ===== Helper Functions =====

function parseNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return false;
}

function extractDate(dateTimeStr: string | undefined | null): string {
  if (!dateTimeStr) return '';
  // Extract YYYY-MM-DD from datetime string
  const match = String(dateTimeStr).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

// ===== CSV Parsers =====

function parsePhysiologicalCycles(rows: CsvRow[]): WhoopCycle[] {
  return rows.map((row) => {
    const cycleStart = String(row['Cycle start time'] ?? '');
    return {
      date: extractDate(cycleStart),
      cycleStart,
      cycleEnd: row['Cycle end time'] ? String(row['Cycle end time']) : null,
      timezone: String(row['Cycle timezone'] ?? 'UTC'),

      // Recovery
      recoveryScore: parseNumber(row['Recovery score %']),
      restingHeartRate: parseNumber(row['Resting heart rate (bpm)']),
      hrv: parseNumber(row['Heart rate variability (ms)']),
      skinTemp: parseNumber(row['Skin temp (celsius)']),
      bloodOxygen: parseNumber(row['Blood oxygen %']),

      // Strain
      dayStrain: parseNumber(row['Day Strain']),
      energyBurned: parseNumber(row['Energy burned (cal)']),
      maxHr: parseNumber(row['Max HR (bpm)']),
      avgHr: parseNumber(row['Average HR (bpm)']),

      // Sleep
      sleepOnset: row['Sleep onset'] ? String(row['Sleep onset']) : null,
      wakeOnset: row['Wake onset'] ? String(row['Wake onset']) : null,
      sleepPerformance: parseNumber(row['Sleep performance %']),
      respiratoryRate: parseNumber(row['Respiratory rate (rpm)']),
      asleepDuration: parseNumber(row['Asleep duration (min)']),
      inBedDuration: parseNumber(row['In bed duration (min)']),
      lightSleepDuration: parseNumber(row['Light sleep duration (min)']),
      deepSleepDuration: parseNumber(row['Deep (SWS) duration (min)']),
      remDuration: parseNumber(row['REM duration (min)']),
      awakeDuration: parseNumber(row['Awake duration (min)']),
      sleepNeed: parseNumber(row['Sleep need (min)']),
      sleepDebt: parseNumber(row['Sleep debt (min)']),
      sleepEfficiency: parseNumber(row['Sleep efficiency %']),
      sleepConsistency: parseNumber(row['Sleep consistency %']),
    };
  });
}

function parseSleeps(rows: CsvRow[]): WhoopSleep[] {
  return rows.map((row) => {
    const cycleStart = String(row['Cycle start time'] ?? '');
    const sleepOnset = String(row['Sleep onset'] ?? '');
    return {
      date: extractDate(sleepOnset || cycleStart),
      cycleStart,
      sleepOnset,
      wakeOnset: String(row['Wake onset'] ?? ''),
      sleepPerformance: parseNumber(row['Sleep performance %']),
      respiratoryRate: parseNumber(row['Respiratory rate (rpm)']),
      asleepDuration: parseNumber(row['Asleep duration (min)']),
      inBedDuration: parseNumber(row['In bed duration (min)']),
      lightSleepDuration: parseNumber(row['Light sleep duration (min)']),
      deepSleepDuration: parseNumber(row['Deep (SWS) duration (min)']),
      remDuration: parseNumber(row['REM duration (min)']),
      awakeDuration: parseNumber(row['Awake duration (min)']),
      sleepNeed: parseNumber(row['Sleep need (min)']),
      sleepDebt: parseNumber(row['Sleep debt (min)']),
      sleepEfficiency: parseNumber(row['Sleep efficiency %']),
      sleepConsistency: parseNumber(row['Sleep consistency %']),
      isNap: parseBoolean(row['Nap']),
    };
  });
}

function parseWorkouts(rows: CsvRow[]): WhoopWorkout[] {
  return rows.map((row) => {
    const workoutStart = String(row['Workout start time'] ?? '');
    return {
      date: extractDate(workoutStart),
      cycleStart: String(row['Cycle start time'] ?? ''),
      workoutStart,
      workoutEnd: String(row['Workout end time'] ?? ''),
      duration: parseNumber(row['Duration (min)']) ?? 0,
      activityName: String(row['Activity name'] ?? 'Unknown'),
      activityStrain: parseNumber(row['Activity Strain']),
      energyBurned: parseNumber(row['Energy burned (cal)']),
      maxHr: parseNumber(row['Max HR (bpm)']),
      avgHr: parseNumber(row['Average HR (bpm)']),
      hrZone1: parseNumber(row['HR Zone 1 %']),
      hrZone2: parseNumber(row['HR Zone 2 %']),
      hrZone3: parseNumber(row['HR Zone 3 %']),
      hrZone4: parseNumber(row['HR Zone 4 %']),
      hrZone5: parseNumber(row['HR Zone 5 %']),
      gpsEnabled: parseBoolean(row['GPS enabled']),
    };
  });
}

function parseJournalEntries(rows: CsvRow[]): WhoopJournalEntry[] {
  return rows.map((row) => {
    const cycleStart = String(row['Cycle start time'] ?? '');
    return {
      date: extractDate(cycleStart),
      cycleStart,
      question: String(row['Question text'] ?? ''),
      answeredYes: parseBoolean(row['Answered yes']),
      notes: row['Notes'] ? String(row['Notes']) : null,
    };
  });
}

// ===== Main Parser =====

/**
 * Parse a Whoop data export folder
 * @param folderPath Path to the Whoop export folder
 * @returns Parsed Whoop data
 */
export function parseWhoopFolder(folderPath: string): WhoopData {
  console.log(`[Whoop] Parsing folder: ${folderPath}`);

  const result: WhoopData = {
    cycles: [],
    sleeps: [],
    workouts: [],
    journalEntries: [],
    dateRange: { start: null, end: null },
  };

  // Check if folder exists
  if (!fs.existsSync(folderPath)) {
    console.warn(`[Whoop] Folder not found: ${folderPath}`);
    return result;
  }

  // Parse each CSV file if it exists
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const ext = path.extname(file).toLowerCase();

    if (ext !== '.csv') continue;

    try {
      const rows = parseCsv(filePath);
      const fileName = file.toLowerCase();

      if (fileName.includes('physiological_cycles')) {
        result.cycles = parsePhysiologicalCycles(rows);
        console.log(`[Whoop] Parsed ${result.cycles.length} physiological cycles`);
      } else if (fileName.includes('sleeps')) {
        result.sleeps = parseSleeps(rows);
        console.log(`[Whoop] Parsed ${result.sleeps.length} sleep records`);
      } else if (fileName.includes('workouts')) {
        result.workouts = parseWorkouts(rows);
        console.log(`[Whoop] Parsed ${result.workouts.length} workouts`);
      } else if (fileName.includes('journal')) {
        result.journalEntries = parseJournalEntries(rows);
        console.log(`[Whoop] Parsed ${result.journalEntries.length} journal entries`);
      }
    } catch (error) {
      console.error(`[Whoop] Error parsing ${file}:`, error);
    }
  }

  // Calculate date range
  const allDates = [
    ...result.cycles.map((c) => c.date),
    ...result.sleeps.map((s) => s.date),
    ...result.workouts.map((w) => w.date),
  ].filter((d) => d);

  if (allDates.length > 0) {
    allDates.sort();
    result.dateRange.start = allDates[0];
    result.dateRange.end = allDates[allDates.length - 1];
  }

  console.log(`[Whoop] Date range: ${result.dateRange.start} to ${result.dateRange.end}`);

  return result;
}

/**
 * Check if a folder is a Whoop data export
 */
export function isWhoopFolder(folderPath: string): boolean {
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return false;
  }

  const files = fs.readdirSync(folderPath);
  const csvFiles = files.filter((f) => f.endsWith('.csv'));

  // Check for characteristic Whoop files
  const hasPhysiological = csvFiles.some((f) => f.toLowerCase().includes('physiological'));
  const hasSleeps = csvFiles.some((f) => f.toLowerCase().includes('sleeps'));

  return hasPhysiological || hasSleeps;
}
