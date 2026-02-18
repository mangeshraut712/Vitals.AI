import fs from 'fs';
import path from 'path';
import type { ActivityData } from '@/lib/store/health-data';
import { parseCsv, CsvRow } from './csv';

/**
 * Google Fit Data Parser
 * Supports Google Takeout exports from Google Fit
 * Also handles Pixel Watch 2/3 and Wear OS device exports
 *
 * Export format: Google Takeout → Google Fit → All data
 * Produces a folder with CSV files per activity type
 */

// ===== Type Definitions =====

export interface GoogleFitActivity {
    date: string;
    startTime: string;
    endTime: string;
    activityType: string;
    steps?: number;
    distance?: number; // meters
    calories?: number; // kcal
    heartRateAvg?: number; // bpm
    heartRateMax?: number;
    heartRateMin?: number;
    speed?: number; // m/s
    power?: number; // watts
    vo2Max?: number; // mL/kg/min
}

export interface GoogleFitDailySummary {
    date: string;
    steps?: number;
    distance?: number; // meters
    calories?: number; // kcal
    activeMinutes?: number;
    heartPoints?: number;
    moveMinutes?: number;
    heartRateAvg?: number;
    heartRateMin?: number;
    heartRateMax?: number;
    weight?: number; // kg
    bodyFat?: number; // %
    bmi?: number;
}

export interface GoogleFitSleepRecord {
    date: string;
    startTime: string;
    endTime: string;
    sleepType: string; // 'light', 'deep', 'rem', 'awake', 'sleep'
    durationMinutes?: number;
}

export interface GoogleFitHeartRate {
    date: string;
    time: string;
    bpm?: number;
}

export interface GoogleFitOxygenSaturation {
    date: string;
    time: string;
    spO2?: number; // %
}

export interface GoogleFitData {
    activities: GoogleFitActivity[];
    dailySummaries: GoogleFitDailySummary[];
    sleepRecords: GoogleFitSleepRecord[];
    heartRates: GoogleFitHeartRate[];
    oxygenSaturation: GoogleFitOxygenSaturation[];
    dateRange: { start: string | null; end: string | null };
}

// ===== Helper Functions =====

function parseNum(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return isNaN(n) ? undefined : n;
}

function extractDate(dateStr: string): string {
    const match = String(dateStr).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
}

// ===== CSV Parsers =====

function parseActivities(rows: CsvRow[]): GoogleFitActivity[] {
    return rows.map((row) => ({
        date: extractDate(String(row['Start time'] ?? row['start_time'] ?? '')),
        startTime: String(row['Start time'] ?? row['start_time'] ?? ''),
        endTime: String(row['End time'] ?? row['end_time'] ?? ''),
        activityType: String(row['Activity type'] ?? row['activity_type'] ?? 'Unknown'),
        steps: parseNum(row['Step count'] ?? row['steps']),
        distance: parseNum(row['Distance (m)'] ?? row['distance']),
        calories: parseNum(row['Calories (kcal)'] ?? row['calories']),
        heartRateAvg: parseNum(row['Average heart rate (bpm)'] ?? row['heart_rate_avg']),
        heartRateMax: parseNum(row['Max heart rate (bpm)'] ?? row['heart_rate_max']),
        heartRateMin: parseNum(row['Min heart rate (bpm)'] ?? row['heart_rate_min']),
        speed: parseNum(row['Average speed (m/s)'] ?? row['speed']),
        power: parseNum(row['Average power (W)'] ?? row['power']),
        vo2Max: parseNum(row['VO2 max (mL/kg/min)'] ?? row['vo2_max']),
    })).filter((r) => r.date);
}

function parseDailySummaries(rows: CsvRow[]): GoogleFitDailySummary[] {
    return rows.map((row) => ({
        date: extractDate(String(row['Date'] ?? row['date'] ?? '')),
        steps: parseNum(row['Step count'] ?? row['steps']),
        distance: parseNum(row['Distance (m)'] ?? row['distance']),
        calories: parseNum(row['Calories (kcal)'] ?? row['calories']),
        activeMinutes: parseNum(row['Active minutes'] ?? row['active_minutes']),
        heartPoints: parseNum(row['Heart Points'] ?? row['heart_points']),
        moveMinutes: parseNum(row['Move Minutes count'] ?? row['move_minutes']),
        heartRateAvg: parseNum(row['Average heart rate (bpm)'] ?? row['heart_rate_avg']),
        heartRateMin: parseNum(row['Min heart rate (bpm)'] ?? row['heart_rate_min']),
        heartRateMax: parseNum(row['Max heart rate (bpm)'] ?? row['heart_rate_max']),
        weight: parseNum(row['Weight (kg)'] ?? row['weight']),
        bodyFat: parseNum(row['Body fat percentage (%)'] ?? row['body_fat']),
        bmi: parseNum(row['BMI'] ?? row['bmi']),
    })).filter((r) => r.date);
}

function parseSleepRecords(rows: CsvRow[]): GoogleFitSleepRecord[] {
    return rows.map((row) => {
        const startTime = String(row['Start time'] ?? row['start_time'] ?? '');
        return {
            date: extractDate(startTime),
            startTime,
            endTime: String(row['End time'] ?? row['end_time'] ?? ''),
            sleepType: String(row['Sleep stage'] ?? row['sleep_type'] ?? 'sleep'),
            durationMinutes: parseNum(row['Duration (ms)']) !== undefined
                ? Math.round((parseNum(row['Duration (ms)']) ?? 0) / 60000)
                : parseNum(row['duration_minutes']),
        };
    }).filter((r) => r.date);
}

function parseHeartRates(rows: CsvRow[]): GoogleFitHeartRate[] {
    return rows.map((row) => ({
        date: extractDate(String(row['Start time'] ?? row['date'] ?? '')),
        time: String(row['Start time'] ?? ''),
        bpm: parseNum(row['BPM'] ?? row['bpm'] ?? row['heart_rate']),
    })).filter((r) => r.date);
}

// ===== Main Parser =====

export function parseGoogleFitExport(folderPath: string): GoogleFitData {
    console.log(`[Google Fit] Parsing folder: ${folderPath}`);

    const result: GoogleFitData = {
        activities: [],
        dailySummaries: [],
        sleepRecords: [],
        heartRates: [],
        oxygenSaturation: [],
        dateRange: { start: null, end: null },
    };

    if (!fs.existsSync(folderPath)) {
        console.warn(`[Google Fit] Folder not found: ${folderPath}`);
        return result;
    }

    function scanFolder(dirPath: string, depth: number = 0): void {
        if (depth > 4) return;
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                scanFolder(entryPath, depth + 1);
                continue;
            }

            if (!entry.name.toLowerCase().endsWith('.csv')) continue;

            const lowerFile = entry.name.toLowerCase();

            try {
                const rows = parseCsv(entryPath);

                if (lowerFile.includes('daily_activity_summary') || lowerFile.includes('daily_summary')) {
                    result.dailySummaries.push(...parseDailySummaries(rows));
                } else if (lowerFile.includes('sleep')) {
                    result.sleepRecords.push(...parseSleepRecords(rows));
                } else if (lowerFile.includes('heart_rate') || lowerFile.includes('heartrate')) {
                    result.heartRates.push(...parseHeartRates(rows));
                } else if (lowerFile.includes('activity')) {
                    result.activities.push(...parseActivities(rows));
                } else if (lowerFile.includes('spo2') || lowerFile.includes('oxygen')) {
                    // Parse SpO2 data
                    result.oxygenSaturation.push(
                        ...rows.map((row) => ({
                            date: extractDate(String(row['Start time'] ?? '')),
                            time: String(row['Start time'] ?? ''),
                            spO2: parseNum(row['SpO2 (%)'] ?? row['spo2']),
                        })).filter((r) => r.date)
                    );
                }
            } catch (error) {
                console.error(`[Google Fit] Error parsing ${entry.name}:`, error);
            }
        }
    }

    scanFolder(folderPath);

    console.log(`[Google Fit] Parsed: ${result.dailySummaries.length} daily summaries, ${result.activities.length} activities, ${result.sleepRecords.length} sleep records`);

    // Calculate date range
    const allDates = [
        ...result.dailySummaries.map((d) => d.date),
        ...result.activities.map((a) => a.date),
    ].filter((d) => d);

    if (allDates.length > 0) {
        allDates.sort();
        result.dateRange.start = allDates[0];
        result.dateRange.end = allDates[allDates.length - 1];
    }

    return result;
}

/**
 * Convert Google Fit data to ActivityData format
 */
export function convertGoogleFitToActivity(googleFitData: GoogleFitData): ActivityData[] {
    const dataByDate = new Map<string, ActivityData>();

    // Process daily summaries (primary source)
    for (const summary of googleFitData.dailySummaries) {
        if (!summary.date) continue;

        const existing = dataByDate.get(summary.date) ?? {
            date: summary.date,
            hrv: 0,
            rhr: 0,
            sleepHours: 0,
        };

        existing.steps = summary.steps;
        existing.rhr = Math.round(summary.heartRateMin ?? summary.heartRateAvg ?? existing.rhr);

        dataByDate.set(summary.date, existing);
    }

    // Process sleep records - aggregate by date
    const sleepByDate = new Map<string, { totalMin: number; stages: string[] }>();
    for (const sleep of googleFitData.sleepRecords) {
        if (!sleep.date) continue;
        const existing = sleepByDate.get(sleep.date) ?? { totalMin: 0, stages: [] };
        if (sleep.sleepType !== 'awake') {
            existing.totalMin += sleep.durationMinutes ?? 0;
        }
        existing.stages.push(sleep.sleepType);
        sleepByDate.set(sleep.date, existing);
    }

    for (const [date, sleepData] of sleepByDate) {
        const existing = dataByDate.get(date) ?? {
            date,
            hrv: 0,
            rhr: 0,
            sleepHours: 0,
        };
        existing.sleepHours = Math.round((sleepData.totalMin / 60) * 10) / 10;
        dataByDate.set(date, existing);
    }

    const activityData = Array.from(dataByDate.values());
    activityData.sort((a, b) => a.date.localeCompare(b.date));
    return activityData;
}

/**
 * Check if a folder contains Google Fit export data
 */
export function isGoogleFitFolder(folderPath: string): boolean {
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        return false;
    }

    function checkDir(dirPath: string, depth: number = 0): boolean {
        if (depth > 3) return false;
        const files = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const f of files) {
            const lowerName = f.name.toLowerCase();
            if (
                lowerName.includes('google_fit') ||
                lowerName.includes('googlefit') ||
                lowerName === 'takeout' ||
                lowerName.includes('daily_activity_summary') ||
                lowerName.includes('heart_rate_bpm')
            ) {
                return true;
            }
            if (f.isDirectory()) {
                if (checkDir(path.join(dirPath, f.name), depth + 1)) return true;
            }
        }
        return false;
    }

    return checkDir(folderPath);
}
