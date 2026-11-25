import { describe, expect, it } from 'vitest';
import { convertAppleHealthToActivity, type AppleHealthData } from '../apple-health';
import { convertOuraToActivity, type OuraData } from '../oura';

describe('placeholder wearable zeros', () => {
  it('omits Apple Health steps when that day has no step samples', () => {
    const data: AppleHealthData = {
      dailyData: new Map([
        [
          '2026-01-01',
          {
            date: '2026-01-01',
            hrvValues: [55],
            rhrValues: [],
            sleepMinutes: 0,
            steps: 0,
            activeCalories: 0,
          },
        ],
      ]),
      workouts: [],
      dateRange: { start: '2026-01-01', end: '2026-01-01' },
    };

    const [day] = convertAppleHealthToActivity(data);

    expect(day?.hrv).toBe(55);
    expect(day?.steps).toBeUndefined();
  });

  it('keeps an explicit Oura zero and leaves a missing score unset', () => {
    const base = {
      temperature_deviation: 0,
      temperature_trend_deviation: 0,
      contributors: {
        activity_balance: 0,
        body_temperature: 0,
        hrv_balance: 0,
        previous_day_activity: 0,
        previous_night: 0,
        recovery_index: 0,
        resting_heart_rate: 0,
        sleep_balance: 0,
      },
    };
    const recorded: OuraData = {
      readiness: [{ day: '2026-01-01', score: 0, ...base }],
      sleepScores: [],
      sleeps: [
        {
          day: '2026-01-01',
          bedtime_start: '',
          bedtime_end: '',
          total_sleep_duration: 8 * 3600,
          deep_sleep_duration: 0,
          light_sleep_duration: 0,
          rem_sleep_duration: 0,
          awake_time: 0,
          efficiency: 0,
          average_heart_rate: 0,
          lowest_heart_rate: 0,
          average_hrv: 50,
        },
      ],
      activities: [
        {
          day: '2026-01-01',
          score: 0,
          steps: 0,
          active_calories: 0,
          total_calories: 0,
          target_calories: 0,
          meet_daily_targets: 0,
        },
      ],
      heartRates: [],
      dateRange: { start: '2026-01-01', end: '2026-01-01' },
    };
    const missing: OuraData = {
      ...recorded,
      readiness: [{ day: '2026-01-01', ...base }],
      sleeps: [{ ...recorded.sleeps[0], efficiency: undefined }],
      activities: [{ ...recorded.activities[0], steps: undefined }],
    };

    const [recordedDay] = convertOuraToActivity(recorded);
    const [missingDay] = convertOuraToActivity(missing);

    expect(recordedDay).toMatchObject({ recovery: 0, steps: 0, sleepScore: 0 });
    expect(missingDay?.recovery).toBeUndefined();
    expect(missingDay?.steps).toBeUndefined();
    expect(missingDay?.sleepScore).toBeUndefined();
  });
});
