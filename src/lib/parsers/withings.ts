import fs from 'fs';
import path from 'path';
import type { ActivityData } from '@/lib/store/health-data';
import { parseCsv, CsvRow } from './csv';

/**
 * Withings Data Parser
 * Supports Withings Health Mate CSV exports from:
 * - Body+ / Body Cardio (weight, body composition, heart rate)
 * - ScanWatch (heart rate, SpO2, sleep, activity)
 * - Sleep Analyzer (sleep stages, breathing disturbances)
 */

// ===== Type Definitions =====

export interface WithingsBodyMeasurement {
    date: string;
    weight?: number; // kg
    fatRatio?: number; // %
    fatMassWeight?: number; // kg
    fatFreeMassWeight?: number; // kg
    muscleMassWeight?: number; // kg
    boneMassWeight?: number; // kg
    hydration?: number; // %
    pulseWaveVelocity?: number; // m/s (arterial stiffness)
    heartRate?: number; // bpm
    visceralFatIndex?: number;
}

export interface WithingsSleepRecord {
    date: string;
    startTime: string;
    endTime: string;
    durationToSleep?: number; // seconds
    durationToWakeup?: number; // seconds
    hrAverage?: number; // bpm
    hrMin?: number;
    hrMax?: number;
    rmssd?: number; // HRV ms
    breathingDisturbancesIntensity?: number;
    deepSleepDuration?: number; // seconds
    lightSleepDuration?: number; // seconds
    remSleepDuration?: number; // seconds
    wakeupDuration?: number; // seconds
    sleepScore?: number; // 0-100
    snoring?: number; // seconds
    snoringEpisodeCount?: number;
    apneaHypopneaIndex?: number;
    spO2Average?: number; // %
    spO2Min?: number;
}

export interface WithingsActivityRecord {
    date: string;
    steps?: number;
    distance?: number; // meters
    elevation?: number; // meters
    softActivityDuration?: number; // seconds
    moderateActivityDuration?: number; // seconds
    intenseActivityDuration?: number; // seconds
    activeCalories?: number; // kcal
    totalCalories?: number; // kcal
    hrAverage?: number; // bpm
    hrMin?: number;
    hrMax?: number;
    hrZone0?: number; // seconds in zone 0 (rest)
    hrZone1?: number; // seconds in zone 1 (light)
    hrZone2?: number; // seconds in zone 2 (moderate)
    hrZone3?: number; // seconds in zone 3 (intense)
}

export interface WithingsIntraDayActivity {
    date: string;
    time: string;
    steps?: number;
    calories?: number;
    elevation?: number;
    heartRate?: number;
    spO2?: number;
}

export interface WithingsData {
    bodyMeasurements: WithingsBodyMeasurement[];
    sleepRecords: WithingsSleepRecord[];
    activityRecords: WithingsActivityRecord[];
    intraDayActivities: WithingsIntraDayActivity[];
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

function parseBodyMeasurements(rows: CsvRow[]): WithingsBodyMeasurement[] {
    return rows.map((row) => ({
        date: extractDate(String(row['Date'] ?? row['date'] ?? '')),
        // Actual Withings column names from export
        weight: parseNum(row['Weight (kg)'] ?? row['weight'] ?? row['Weight']),
        fatRatio: parseNum(row['Fat ratio (%)'] ?? row['fat_ratio'] ?? row['Fat ratio']),
        fatMassWeight: parseNum(row['Fat mass (kg)'] ?? row['Fat mass weight (kg)'] ?? row['fat_mass_weight']),
        fatFreeMassWeight: parseNum(row['Fat free mass (kg)'] ?? row['Fat free mass weight (kg)'] ?? row['fat_free_mass_weight']),
        muscleMassWeight: parseNum(row['Muscle mass (kg)'] ?? row['Muscle mass'] ?? row['muscle_mass']),
        boneMassWeight: parseNum(row['Bone mass (kg)'] ?? row['Bone mass'] ?? row['bone_mass']),
        hydration: parseNum(row['Hydration (kg)'] ?? row['Hydration (%)'] ?? row['hydration']),
        pulseWaveVelocity: parseNum(row['Pulse Wave Velocity (m/s)'] ?? row['pulse_wave_velocity']),
        heartRate: parseNum(row['Heart rate'] ?? row['Heart rate (bpm)'] ?? row['heart_rate']),
        visceralFatIndex: parseNum(row['Visceral fat index'] ?? row['visceral_fat_index']),
    })).filter((r) => r.date);
}

function parseSleepRecords(rows: CsvRow[]): WithingsSleepRecord[] {
    return rows.map((row) => ({
        date: extractDate(String(row['from'] ?? row['Date'] ?? row['date'] ?? '')),
        startTime: String(row['from'] ?? row['start_time'] ?? ''),
        endTime: String(row['to'] ?? row['end_time'] ?? ''),
        durationToSleep: parseNum(row['duration to sleep'] ?? row['duration_to_sleep']),
        durationToWakeup: parseNum(row['duration to wakeup'] ?? row['duration_to_wakeup']),
        hrAverage: parseNum(row['hr_average'] ?? row['HR average (bpm)']),
        hrMin: parseNum(row['hr_min'] ?? row['HR min (bpm)']),
        hrMax: parseNum(row['hr_max'] ?? row['HR max (bpm)']),
        rmssd: parseNum(row['rmssd'] ?? row['HRV (ms)']),
        breathingDisturbancesIntensity: parseNum(row['breathing_disturbances_intensity']),
        deepSleepDuration: parseNum(row['deepsleepduration'] ?? row['deep_sleep_duration']),
        lightSleepDuration: parseNum(row['lightsleepduration'] ?? row['light_sleep_duration']),
        remSleepDuration: parseNum(row['remsleepduration'] ?? row['rem_sleep_duration']),
        wakeupDuration: parseNum(row['wakeupduration'] ?? row['wakeup_duration']),
        sleepScore: parseNum(row['sleep_score'] ?? row['Sleep score']),
        snoring: parseNum(row['snoring']),
        snoringEpisodeCount: parseNum(row['snoringepisodecount']),
        apneaHypopneaIndex: parseNum(row['apnea_hypopnea_index']),
        spO2Average: parseNum(row['spo2_average'] ?? row['SpO2 average (%)']),
        spO2Min: parseNum(row['spo2_min']),
    })).filter((r) => r.date);
}

function parseActivityRecords(rows: CsvRow[]): WithingsActivityRecord[] {
    return rows.map((row) => ({
        date: extractDate(String(row['Date'] ?? row['date'] ?? '')),
        steps: parseNum(row['Steps'] ?? row['steps']),
        distance: parseNum(row['Distance (m)'] ?? row['distance']),
        elevation: parseNum(row['Elevation (m)'] ?? row['elevation']),
        softActivityDuration: parseNum(row['Soft activities duration (s)'] ?? row['soft_activity_duration']),
        moderateActivityDuration: parseNum(row['Moderate activities duration (s)'] ?? row['moderate_activity_duration']),
        intenseActivityDuration: parseNum(row['Intense activities duration (s)'] ?? row['intense_activity_duration']),
        activeCalories: parseNum(row['Active calories (kcal)'] ?? row['active_calories']),
        totalCalories: parseNum(row['Total calories (kcal)'] ?? row['total_calories']),
        hrAverage: parseNum(row['HR average (bpm)'] ?? row['hr_average']),
        hrMin: parseNum(row['HR min (bpm)'] ?? row['hr_min']),
        hrMax: parseNum(row['HR max (bpm)'] ?? row['hr_max']),
        hrZone0: parseNum(row['HR zone 0 (s)'] ?? row['hr_zone_0']),
        hrZone1: parseNum(row['HR zone 1 (s)'] ?? row['hr_zone_1']),
        hrZone2: parseNum(row['HR zone 2 (s)'] ?? row['hr_zone_2']),
        hrZone3: parseNum(row['HR zone 3 (s)'] ?? row['hr_zone_3']),
    })).filter((r) => r.date);
}

// ===== Main Parser =====

export function parseWithingsExport(folderPath: string): WithingsData {
    console.log(`[Withings] Parsing folder: ${folderPath}`);

    const result: WithingsData = {
        bodyMeasurements: [],
        sleepRecords: [],
        activityRecords: [],
        intraDayActivities: [],
        dateRange: { start: null, end: null },
    };

    let folderExists = false;
    try { folderExists = fs.existsSync(folderPath); } catch { return result; }
    if (!folderExists) {
        console.warn(`[Withings] Folder not found: ${folderPath}`);
        return result;
    }

    let files: string[] = [];
    try { files = fs.readdirSync(folderPath); } catch { return result; }

    // Track steps by date from aggregates_steps.csv
    const stepsByDate = new Map<string, number>();
    const caloriesByDate = new Map<string, number>();

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const lowerFile = file.toLowerCase();

        if (!lowerFile.endsWith('.csv')) continue;

        try {
            const rows = parseCsv(filePath);

            if (lowerFile.includes('weight') || (lowerFile.includes('body') && !lowerFile.includes('blood'))) {
                result.bodyMeasurements = parseBodyMeasurements(rows);
                console.log(`[Withings] Parsed ${result.bodyMeasurements.length} body measurements`);
            } else if (lowerFile.includes('sleep') && !lowerFile.startsWith('raw_')) {
                result.sleepRecords = parseSleepRecords(rows);
                console.log(`[Withings] Parsed ${result.sleepRecords.length} sleep records`);
            } else if (lowerFile === 'activities.csv' || (lowerFile.includes('activity') && !lowerFile.startsWith('raw_'))) {
                result.activityRecords = parseActivityRecords(rows);
                console.log(`[Withings] Parsed ${result.activityRecords.length} activity records`);
            } else if (lowerFile === 'aggregates_steps.csv') {
                // Format: date,value
                for (const row of rows) {
                    const d = extractDate(String(row['date'] ?? row['Date'] ?? ''));
                    const v = parseNum(row['value'] ?? row['Value']);
                    if (d && v !== undefined) stepsByDate.set(d, v);
                }
                console.log(`[Withings] Parsed ${stepsByDate.size} step records`);
            } else if (lowerFile === 'aggregates_calories_passive.csv' || lowerFile === 'aggregates_calories_earned.csv') {
                for (const row of rows) {
                    const d = extractDate(String(row['date'] ?? row['Date'] ?? ''));
                    const v = parseNum(row['value'] ?? row['Value']);
                    if (d && v !== undefined) {
                        caloriesByDate.set(d, (caloriesByDate.get(d) ?? 0) + v);
                    }
                }
            }
        } catch (error) {
            console.error(`[Withings] Error parsing ${file}:`, error);
        }
    }

    // Merge steps/calories into activity records
    if (stepsByDate.size > 0) {
        const dateSet = new Set([...stepsByDate.keys(), ...caloriesByDate.keys()]);
        const existingDates = new Set(result.activityRecords.map((r) => r.date));
        for (const date of dateSet) {
            if (!existingDates.has(date)) {
                result.activityRecords.push({
                    date,
                    steps: stepsByDate.get(date),
                    totalCalories: caloriesByDate.get(date),
                });
            } else {
                const rec = result.activityRecords.find((r) => r.date === date);
                if (rec) {
                    if (!rec.steps) rec.steps = stepsByDate.get(date);
                    if (!rec.totalCalories) rec.totalCalories = caloriesByDate.get(date);
                }
            }
        }
        result.activityRecords.sort((a, b) => a.date.localeCompare(b.date));
    }

    // Calculate date range
    const allDates = [
        ...result.bodyMeasurements.map((b) => b.date),
        ...result.sleepRecords.map((s) => s.date),
        ...result.activityRecords.map((a) => a.date),
    ].filter((d) => d);

    if (allDates.length > 0) {
        allDates.sort();
        result.dateRange.start = allDates[0];
        result.dateRange.end = allDates[allDates.length - 1];
    }

    console.log(`[Withings] Date range: ${result.dateRange.start} to ${result.dateRange.end}`);
    return result;
}

/**
 * Convert Withings data to ActivityData format
 */
export function convertWithingsToActivity(withingsData: WithingsData): ActivityData[] {
    const dataByDate = new Map<string, ActivityData>();

    // Process sleep records (primary source for HRV and RHR)
    for (const sleep of withingsData.sleepRecords) {
        if (!sleep.date) continue;

        const totalSleepSec =
            (sleep.deepSleepDuration ?? 0) +
            (sleep.lightSleepDuration ?? 0) +
            (sleep.remSleepDuration ?? 0);

        const existing = dataByDate.get(sleep.date) ?? {
            date: sleep.date,
            hrv: 0,
            rhr: 0,
            sleepHours: 0,
        };

        existing.hrv = Math.round(sleep.rmssd ?? existing.hrv);
        existing.rhr = Math.round(sleep.hrMin ?? sleep.hrAverage ?? existing.rhr);
        existing.sleepHours = Math.round((totalSleepSec / 3600) * 10) / 10;
        existing.sleepScore = sleep.sleepScore;

        dataByDate.set(sleep.date, existing);
    }

    // Add activity data (steps, calories)
    for (const activity of withingsData.activityRecords) {
        if (!activity.date) continue;

        const existing = dataByDate.get(activity.date) ?? {
            date: activity.date,
            hrv: 0,
            rhr: 0,
            sleepHours: 0,
        };

        existing.steps = activity.steps;
        if (activity.hrAverage && existing.rhr === 0) {
            existing.rhr = Math.round(activity.hrAverage);
        }

        dataByDate.set(activity.date, existing);
    }

    const activityData = Array.from(dataByDate.values());
    activityData.sort((a, b) => a.date.localeCompare(b.date));
    return activityData;
}

/**
 * Check if a folder contains Withings export data
 */
export function isWithingsFolder(folderPath: string): boolean {
    try {
        if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
            return false;
        }
        const files = fs.readdirSync(folderPath);
        return files.some(
            (f) =>
                f.toLowerCase().includes('withings') ||
                f.toLowerCase().includes('weight') ||
                f.toLowerCase() === 'bp.csv' ||
                f.toLowerCase() === 'aggregates_steps.csv' ||
                (f.toLowerCase().includes('sleep') && f.toLowerCase().endsWith('.csv')) ||
                f.toLowerCase().includes('body_composition')
        );
    } catch {
        return false;
    }
}
