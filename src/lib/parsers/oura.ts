import fs from 'fs';
import path from 'path';
import type { ActivityData } from '@/lib/store/health-data';
import { parseCsv, CsvRow } from './csv';

/**
 * Oura Ring Data Parser
 * Handles JSON exports from Oura API or CSV exports from the app
 */

// ===== Type Definitions =====

// Oura API v2 daily readiness format
interface OuraDailyReadiness {
  day: string;
  score: number;
  temperature_deviation: number;
  temperature_trend_deviation: number;
  contributors: {
    activity_balance: number;
    body_temperature: number;
    hrv_balance: number;
    previous_day_activity: number;
    previous_night: number;
    recovery_index: number;
    resting_heart_rate: number;
    sleep_balance: number;
  };
}

// Oura API v2 daily sleep format
interface OuraDailySleep {
  day: string;
  score: number;
  timestamp: string;
  contributors: {
    deep_sleep: number;
    efficiency: number;
    latency: number;
    rem_sleep: number;
    restfulness: number;
    timing: number;
    total_sleep: number;
  };
}

// Oura API v2 sleep format
interface OuraSleep {
  day: string;
  bedtime_start: string;
  bedtime_end: string;
  total_sleep_duration: number; // seconds
  deep_sleep_duration: number;
  light_sleep_duration: number;
  rem_sleep_duration: number;
  awake_time: number;
  efficiency: number;
  average_heart_rate: number;
  lowest_heart_rate: number;
  average_hrv: number;
}

// Oura API v2 daily activity format
interface OuraDailyActivity {
  day: string;
  score: number;
  steps: number;
  active_calories: number;
  total_calories: number;
  target_calories: number;
  meet_daily_targets: number;
}

// Oura API v2 heart rate format
interface OuraHeartRate {
  timestamp: string;
  bpm: number;
  source: string;
}

export interface OuraData {
  readiness: OuraDailyReadiness[];
  sleepScores: OuraDailySleep[];
  sleeps: OuraSleep[];
  activities: OuraDailyActivity[];
  heartRates: OuraHeartRate[];
  dateRange: { start: string | null; end: string | null };
}

// ===== Helper Functions =====

function extractDate(dateStr: string): string {
  // Oura dates are in YYYY-MM-DD format
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function parseJsonFile<T>(filePath: string): T[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Handle both array format and object with data array
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch {
    return [];
  }
}

// ===== Main Parser =====

/**
 * Parse Oura data export folder
 * Supports both JSON API exports and CSV app exports
 */
export function parseOuraExport(folderPath: string): OuraData {
  console.log(`[Oura] Parsing folder: ${folderPath}`);

  const result: OuraData = {
    readiness: [],
    sleepScores: [],
    sleeps: [],
    activities: [],
    heartRates: [],
    dateRange: { start: null, end: null },
  };

  if (!fs.existsSync(folderPath)) {
    console.warn(`[Oura] Folder not found: ${folderPath}`);
    return result;
  }

  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const lowerFile = file.toLowerCase();

    if (lowerFile.endsWith('.json')) {
      // Parse JSON files
      if (lowerFile.includes('readiness')) {
        result.readiness = parseJsonFile<OuraDailyReadiness>(filePath);
        console.log(`[Oura] Parsed ${result.readiness.length} readiness records`);
      } else if (lowerFile.includes('daily_sleep')) {
        result.sleepScores = parseJsonFile<OuraDailySleep>(filePath);
        console.log(`[Oura] Parsed ${result.sleepScores.length} daily sleep scores`);
      } else if (lowerFile.includes('sleep') && !lowerFile.includes('daily')) {
        result.sleeps = parseJsonFile<OuraSleep>(filePath);
        console.log(`[Oura] Parsed ${result.sleeps.length} sleep records`);
      } else if (lowerFile.includes('activity')) {
        result.activities = parseJsonFile<OuraDailyActivity>(filePath);
        console.log(`[Oura] Parsed ${result.activities.length} activity records`);
      } else if (lowerFile.includes('heart_rate') || lowerFile.includes('heartrate')) {
        result.heartRates = parseJsonFile<OuraHeartRate>(filePath);
        console.log(`[Oura] Parsed ${result.heartRates.length} heart rate records`);
      }
    } else if (lowerFile.endsWith('.csv')) {
      // Parse CSV files (app export format)
      const rows = parseCsv(filePath);
      if (lowerFile.includes('sleep')) {
        result.sleeps = parseOuraSleepCsv(rows);
        console.log(`[Oura] Parsed ${result.sleeps.length} sleep records from CSV`);
      } else if (lowerFile.includes('readiness')) {
        result.readiness = parseOuraReadinessCsv(rows);
        console.log(`[Oura] Parsed ${result.readiness.length} readiness records from CSV`);
      } else if (lowerFile.includes('activity')) {
        result.activities = parseOuraActivityCsv(rows);
        console.log(`[Oura] Parsed ${result.activities.length} activity records from CSV`);
      }
    }
  }

  // Calculate date range
  const allDates = [
    ...result.readiness.map((r) => r.day),
    ...result.sleeps.map((s) => s.day),
    ...result.activities.map((a) => a.day),
  ]
    .filter((d) => d)
    .map(extractDate)
    .filter((d) => d);

  if (allDates.length > 0) {
    allDates.sort();
    result.dateRange.start = allDates[0];
    result.dateRange.end = allDates[allDates.length - 1];
  }

  console.log(`[Oura] Date range: ${result.dateRange.start} to ${result.dateRange.end}`);

  return result;
}

// CSV parsing helpers for app export format
function parseOuraSleepCsv(rows: CsvRow[]): OuraSleep[] {
  return rows.map((row) => ({
    day: String(row.date ?? row.day ?? ''),
    bedtime_start: String(row.bedtime_start ?? ''),
    bedtime_end: String(row.bedtime_end ?? ''),
    total_sleep_duration: Number(row.total_sleep_duration ?? row.total ?? 0),
    deep_sleep_duration: Number(row.deep_sleep_duration ?? row.deep ?? 0),
    light_sleep_duration: Number(row.light_sleep_duration ?? row.light ?? 0),
    rem_sleep_duration: Number(row.rem_sleep_duration ?? row.rem ?? 0),
    awake_time: Number(row.awake_time ?? row.awake ?? 0),
    efficiency: Number(row.efficiency ?? 0),
    average_heart_rate: Number(row.average_heart_rate ?? row.hr_average ?? 0),
    lowest_heart_rate: Number(row.lowest_heart_rate ?? row.hr_lowest ?? 0),
    average_hrv: Number(row.average_hrv ?? row.hrv_average ?? row.rmssd ?? 0),
  }));
}

function parseOuraReadinessCsv(rows: CsvRow[]): OuraDailyReadiness[] {
  return rows.map((row) => ({
    day: String(row.date ?? row.day ?? ''),
    score: Number(row.score ?? row.readiness_score ?? 0),
    temperature_deviation: Number(row.temperature_deviation ?? 0),
    temperature_trend_deviation: Number(row.temperature_trend_deviation ?? 0),
    contributors: {
      activity_balance: Number(row.activity_balance ?? 0),
      body_temperature: Number(row.body_temperature ?? 0),
      hrv_balance: Number(row.hrv_balance ?? 0),
      previous_day_activity: Number(row.previous_day_activity ?? 0),
      previous_night: Number(row.previous_night ?? 0),
      recovery_index: Number(row.recovery_index ?? 0),
      resting_heart_rate: Number(row.resting_heart_rate ?? 0),
      sleep_balance: Number(row.sleep_balance ?? 0),
    },
  }));
}

function parseOuraActivityCsv(rows: CsvRow[]): OuraDailyActivity[] {
  return rows.map((row) => ({
    day: String(row.date ?? row.day ?? ''),
    score: Number(row.score ?? row.activity_score ?? 0),
    steps: Number(row.steps ?? 0),
    active_calories: Number(row.active_calories ?? row.cal_active ?? 0),
    total_calories: Number(row.total_calories ?? row.cal_total ?? 0),
    target_calories: Number(row.target_calories ?? 0),
    meet_daily_targets: Number(row.meet_daily_targets ?? 0),
  }));
}

/**
 * Convert Oura data to ActivityData format
 */
export function convertOuraToActivity(ouraData: OuraData): ActivityData[] {
  // Create a map of date -> ActivityData
  const dataByDate = new Map<string, ActivityData>();

  // Process sleep data (primary source for HRV and RHR)
  for (const sleep of ouraData.sleeps) {
    const date = extractDate(sleep.day);
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

    existing.hrv = Math.round(sleep.average_hrv || 0);
    existing.rhr = Math.round(sleep.lowest_heart_rate || sleep.average_heart_rate || 0);
    existing.sleepHours = Math.round((sleep.total_sleep_duration / 3600) * 10) / 10; // seconds to hours
    existing.sleepScore = Math.round(sleep.efficiency || 0);

    dataByDate.set(date, existing);
  }

  // Add readiness scores (maps to recovery)
  for (const readiness of ouraData.readiness) {
    const date = extractDate(readiness.day);
    if (!date) continue;

    const existing = dataByDate.get(date);
    if (existing) {
      existing.recovery = readiness.score;
    }
  }

  // Add sleep scores
  for (const sleepScore of ouraData.sleepScores) {
    const date = extractDate(sleepScore.day);
    if (!date) continue;

    const existing = dataByDate.get(date);
    if (existing) {
      existing.sleepScore = sleepScore.score;
    }
  }

  // Add activity data (steps)
  for (const activity of ouraData.activities) {
    const date = extractDate(activity.day);
    if (!date) continue;

    const existing = dataByDate.get(date);
    if (existing) {
      existing.steps = activity.steps;
    }
  }

  // Convert to array and sort
  const activityData = Array.from(dataByDate.values());
  activityData.sort((a, b) => a.date.localeCompare(b.date));

  return activityData;
}

/**
 * Check if a folder contains Oura export data
 */
export function isOuraFolder(folderPath: string): boolean {
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return false;
  }

  const files = fs.readdirSync(folderPath);
  return files.some(
    (f) =>
      f.toLowerCase().includes('oura') ||
      f.toLowerCase().startsWith('daily_') ||
      f.toLowerCase().startsWith('sleep_') ||
      f.toLowerCase().startsWith('readiness_')
  );
}
