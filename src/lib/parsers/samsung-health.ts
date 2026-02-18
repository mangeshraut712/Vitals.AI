import fs from 'fs';
import path from 'path';
import type { ActivityData } from '@/lib/store/health-data';
import { parseCsv, CsvRow } from './csv';

/**
 * Samsung Health Data Parser
 * Supports Samsung Health CSV exports from Galaxy Watch 6/7/Ultra/FE
 * and Samsung Health app (Android) exports
 *
 * Export format: Samsung Health → Profile → Download Personal Data
 * Produces a ZIP with multiple CSV files per category
 */

// ===== Type Definitions =====

export interface SamsungSleepRecord {
    date: string;
    startTime: string;
    endTime: string;
    totalSleepDuration?: number; // minutes
    deepSleepDuration?: number; // minutes
    lightSleepDuration?: number; // minutes
    remSleepDuration?: number; // minutes
    awakeDuration?: number; // minutes
    sleepScore?: number; // 0-100
    sleepEfficiency?: number; // %
    spO2Average?: number; // %
    spO2Min?: number;
    hrAverage?: number; // bpm
    hrMin?: number;
    hrMax?: number;
    skinTemperature?: number; // °C
}

export interface SamsungHeartRateRecord {
    date: string;
    time: string;
    heartRate?: number; // bpm
    heartRateMin?: number;
    heartRateMax?: number;
}

export interface SamsungStressRecord {
    date: string;
    time: string;
    stressScore?: number; // 1-100 (Samsung stress index)
}

export interface SamsungActivityRecord {
    date: string;
    steps?: number;
    distance?: number; // meters
    calories?: number; // kcal
    activeTime?: number; // minutes
    exerciseTime?: number; // minutes
    hrAverage?: number; // bpm
    hrMax?: number;
    vo2Max?: number; // mL/kg/min
}

export interface SamsungBodyComposition {
    date: string;
    weight?: number; // kg
    bmi?: number;
    bodyFatPercent?: number; // %
    muscleMass?: number; // kg
    boneMass?: number; // kg
    waterPercent?: number; // %
    skeletalMuscleMass?: number; // kg
    visceralFatLevel?: number;
    basalMetabolicRate?: number; // kcal
}

export interface SamsungWorkout {
    date: string;
    startTime: string;
    endTime: string;
    activityType: string;
    duration?: number; // minutes
    calories?: number; // kcal
    distance?: number; // meters
    hrAverage?: number; // bpm
    hrMax?: number;
    steps?: number;
    cadence?: number; // steps/min
    vo2Max?: number;
}

export interface SamsungData {
    sleepRecords: SamsungSleepRecord[];
    heartRateRecords: SamsungHeartRateRecord[];
    stressRecords: SamsungStressRecord[];
    activityRecords: SamsungActivityRecord[];
    bodyComposition: SamsungBodyComposition[];
    workouts: SamsungWorkout[];
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

function parseSleepRecords(rows: CsvRow[]): SamsungSleepRecord[] {
    return rows.map((row) => ({
        date: extractDate(String(row['start_time'] ?? row['date'] ?? '')),
        startTime: String(row['start_time'] ?? ''),
        endTime: String(row['end_time'] ?? ''),
        totalSleepDuration: parseNum(row['duration'] ?? row['total_sleep_duration']),
        deepSleepDuration: parseNum(row['deep_sleep_duration'] ?? row['deep']),
        lightSleepDuration: parseNum(row['light_sleep_duration'] ?? row['light']),
        remSleepDuration: parseNum(row['rem_sleep_duration'] ?? row['rem']),
        awakeDuration: parseNum(row['awake_duration'] ?? row['awake']),
        sleepScore: parseNum(row['sleep_score'] ?? row['score']),
        sleepEfficiency: parseNum(row['sleep_efficiency'] ?? row['efficiency']),
        spO2Average: parseNum(row['spo2_avg'] ?? row['spo2_average']),
        spO2Min: parseNum(row['spo2_min']),
        hrAverage: parseNum(row['heart_rate_avg'] ?? row['hr_average']),
        hrMin: parseNum(row['heart_rate_min'] ?? row['hr_min']),
        hrMax: parseNum(row['heart_rate_max'] ?? row['hr_max']),
        skinTemperature: parseNum(row['skin_temperature'] ?? row['skin_temp']),
    })).filter((r) => r.date);
}

function parseHeartRateRecords(rows: CsvRow[]): SamsungHeartRateRecord[] {
    return rows.map((row) => ({
        date: extractDate(String(row['start_time'] ?? row['date'] ?? '')),
        time: String(row['start_time'] ?? ''),
        heartRate: parseNum(row['heart_rate'] ?? row['bpm']),
        heartRateMin: parseNum(row['heart_rate_min']),
        heartRateMax: parseNum(row['heart_rate_max']),
    })).filter((r) => r.date);
}

function parseStressRecords(rows: CsvRow[]): SamsungStressRecord[] {
    return rows.map((row) => ({
        date: extractDate(String(row['start_time'] ?? row['date'] ?? '')),
        time: String(row['start_time'] ?? ''),
        stressScore: parseNum(row['stress_score'] ?? row['score']),
    })).filter((r) => r.date);
}

function parseActivityRecords(rows: CsvRow[]): SamsungActivityRecord[] {
    return rows.map((row) => ({
        date: extractDate(String(row['date'] ?? row['start_time'] ?? '')),
        steps: parseNum(row['count'] ?? row['steps']),
        distance: parseNum(row['distance'] ?? row['distance_meters']),
        calories: parseNum(row['calorie'] ?? row['calories']),
        activeTime: parseNum(row['active_time'] ?? row['duration']),
        hrAverage: parseNum(row['heart_rate_avg'] ?? row['hr_average']),
        hrMax: parseNum(row['heart_rate_max'] ?? row['hr_max']),
        vo2Max: parseNum(row['vo2_max']),
    })).filter((r) => r.date);
}

function parseBodyComposition(rows: CsvRow[]): SamsungBodyComposition[] {
    return rows.map((row) => ({
        date: extractDate(String(row['date'] ?? '')),
        weight: parseNum(row['weight'] ?? row['weight_kg']),
        bmi: parseNum(row['bmi']),
        bodyFatPercent: parseNum(row['body_fat'] ?? row['fat_percent']),
        muscleMass: parseNum(row['muscle_mass'] ?? row['skeletal_muscle_mass']),
        boneMass: parseNum(row['bone_mass']),
        waterPercent: parseNum(row['water_percent'] ?? row['body_water']),
        skeletalMuscleMass: parseNum(row['skeletal_muscle_mass']),
        visceralFatLevel: parseNum(row['visceral_fat_level']),
        basalMetabolicRate: parseNum(row['basal_metabolic_rate'] ?? row['bmr']),
    })).filter((r) => r.date);
}

function parseWorkouts(rows: CsvRow[]): SamsungWorkout[] {
    return rows.map((row) => ({
        date: extractDate(String(row['start_time'] ?? '')),
        startTime: String(row['start_time'] ?? ''),
        endTime: String(row['end_time'] ?? ''),
        activityType: String(row['exercise_type'] ?? row['activity_type'] ?? 'Unknown'),
        duration: parseNum(row['duration'] ?? row['exercise_duration']),
        calories: parseNum(row['calorie'] ?? row['calories']),
        distance: parseNum(row['distance']),
        hrAverage: parseNum(row['heart_rate_avg'] ?? row['mean_heart_rate']),
        hrMax: parseNum(row['heart_rate_max'] ?? row['max_heart_rate']),
        steps: parseNum(row['count'] ?? row['step_count']),
        cadence: parseNum(row['cadence']),
        vo2Max: parseNum(row['vo2_max']),
    })).filter((r) => r.date);
}

// ===== Main Parser =====

export function parseSamsungExport(folderPath: string): SamsungData {
    console.log(`[Samsung Health] Parsing folder: ${folderPath}`);

    const result: SamsungData = {
        sleepRecords: [],
        heartRateRecords: [],
        stressRecords: [],
        activityRecords: [],
        bodyComposition: [],
        workouts: [],
        dateRange: { start: null, end: null },
    };

    if (!fs.existsSync(folderPath)) {
        console.warn(`[Samsung Health] Folder not found: ${folderPath}`);
        return result;
    }

    // Samsung exports can be nested in subfolders
    function scanFolder(dirPath: string): void {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                scanFolder(entryPath);
                continue;
            }

            if (!entry.name.toLowerCase().endsWith('.csv')) continue;

            const lowerFile = entry.name.toLowerCase();

            try {
                const rows = parseCsv(entryPath);

                if (lowerFile.includes('sleep')) {
                    result.sleepRecords.push(...parseSleepRecords(rows));
                } else if (lowerFile.includes('heart_rate') || lowerFile.includes('heartrate')) {
                    result.heartRateRecords.push(...parseHeartRateRecords(rows));
                } else if (lowerFile.includes('stress')) {
                    result.stressRecords.push(...parseStressRecords(rows));
                } else if (lowerFile.includes('step') || lowerFile.includes('pedometer') || lowerFile.includes('activity')) {
                    result.activityRecords.push(...parseActivityRecords(rows));
                } else if (lowerFile.includes('body_composition') || lowerFile.includes('weight')) {
                    result.bodyComposition.push(...parseBodyComposition(rows));
                } else if (lowerFile.includes('exercise') || lowerFile.includes('workout')) {
                    result.workouts.push(...parseWorkouts(rows));
                }
            } catch (error) {
                console.error(`[Samsung Health] Error parsing ${entry.name}:`, error);
            }
        }
    }

    scanFolder(folderPath);

    console.log(`[Samsung Health] Parsed: ${result.sleepRecords.length} sleep, ${result.activityRecords.length} activity, ${result.workouts.length} workouts`);

    // Calculate date range
    const allDates = [
        ...result.sleepRecords.map((s) => s.date),
        ...result.activityRecords.map((a) => a.date),
        ...result.workouts.map((w) => w.date),
    ].filter((d) => d);

    if (allDates.length > 0) {
        allDates.sort();
        result.dateRange.start = allDates[0];
        result.dateRange.end = allDates[allDates.length - 1];
    }

    return result;
}

/**
 * Convert Samsung Health data to ActivityData format
 */
export function convertSamsungToActivity(samsungData: SamsungData): ActivityData[] {
    const dataByDate = new Map<string, ActivityData>();

    // Process sleep records
    for (const sleep of samsungData.sleepRecords) {
        if (!sleep.date) continue;

        const existing = dataByDate.get(sleep.date) ?? {
            date: sleep.date,
            hrv: 0,
            rhr: 0,
            sleepHours: 0,
        };

        existing.sleepHours = Math.round(((sleep.totalSleepDuration ?? 0) / 60) * 10) / 10;
        existing.sleepScore = sleep.sleepScore;
        existing.rhr = Math.round(sleep.hrMin ?? sleep.hrAverage ?? existing.rhr);

        dataByDate.set(sleep.date, existing);
    }

    // Compute daily RHR from heart rate records (min of the day)
    const hrByDate = new Map<string, number[]>();
    for (const hr of samsungData.heartRateRecords) {
        if (!hr.date || !hr.heartRate) continue;
        const arr = hrByDate.get(hr.date) ?? [];
        arr.push(hr.heartRate);
        hrByDate.set(hr.date, arr);
    }

    for (const [date, hrs] of hrByDate) {
        const existing = dataByDate.get(date) ?? {
            date,
            hrv: 0,
            rhr: 0,
            sleepHours: 0,
        };
        if (existing.rhr === 0) {
            existing.rhr = Math.round(Math.min(...hrs));
        }
        dataByDate.set(date, existing);
    }

    // Add activity data
    for (const activity of samsungData.activityRecords) {
        if (!activity.date) continue;

        const existing = dataByDate.get(activity.date) ?? {
            date: activity.date,
            hrv: 0,
            rhr: 0,
            sleepHours: 0,
        };

        existing.steps = activity.steps;
        dataByDate.set(activity.date, existing);
    }

    const activityData = Array.from(dataByDate.values());
    activityData.sort((a, b) => a.date.localeCompare(b.date));
    return activityData;
}

/**
 * Check if a folder contains Samsung Health export data
 */
export function isSamsungFolder(folderPath: string): boolean {
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        return false;
    }

    function checkDir(dirPath: string, depth: number = 0): boolean {
        if (depth > 3) return false;
        const files = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const f of files) {
            const lowerName = f.name.toLowerCase();
            if (lowerName.includes('samsung') || lowerName.includes('shealth')) return true;
            if (f.isDirectory()) {
                if (checkDir(path.join(dirPath, f.name), depth + 1)) return true;
            }
            if (
                lowerName.startsWith('com.samsung.health') ||
                lowerName.includes('heart_rate') ||
                (lowerName.includes('sleep') && f.name.endsWith('.csv'))
            ) {
                return true;
            }
        }
        return false;
    }

    return checkDir(folderPath);
}
