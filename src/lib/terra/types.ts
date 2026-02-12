export interface TerraUser {
    user_id: string;
    provider: string;
    last_webhook_update: string | null;
}

export interface TerraActivityPayload {
    user: TerraUser;
    data: Array<{
        metadata: {
            end_time: string;
            start_time: string;
            upload_type: number;
        };
        distance_data: {
            steps: number;
            distance_meters: number;
        };
        calories_data: {
            net_activity_calories: number;
            BMR_calories: number;
            total_burned_calories: number;
        };
        heart_rate_data: {
            summary: {
                max_hr_bpm: number;
                resting_hr_bpm: number;
                avg_hrv_rmssd: number;
                min_hr_bpm: number;
                avg_hr_bpm: number;
                user_max_hr_bpm: number;
            };
        };
        active_durations_data: {
            activity_seconds: number;
            rest_seconds: number;
            low_intensity_seconds: number;
            moderate_intensity_seconds: number;
            vigorous_intensity_seconds: number;
        };
        device_data: {
            name: string;
            hardware_version: string;
            manufacturer: string;
        };
    }>;
    type: 'activity';
}

export interface TerraSleepPayload {
    user: TerraUser;
    data: Array<{
        metadata: {
            end_time: string;
            start_time: string;
            upload_type: number;
        };
        sleep_durations_data: {
            other: {
                duration_in_bed_seconds: number;
                duration_unmeasurable_sleep_seconds: number;
            };
            sleep_efficiency: number;
            awake: {
                duration_short_interruption_seconds: number;
                duration_awake_state_seconds: number;
                duration_long_interruption_seconds: number;
                num_wakeup_events: number;
                wake_up_latency_seconds: number;
                num_out_of_bed_events: number;
                sleep_latency_seconds: number;
            };
            asleep: {
                duration_light_sleep_state_seconds: number;
                duration_asleep_state_seconds: number;
                num_REM_events: number;
                duration_REM_sleep_state_seconds: number;
                duration_deep_sleep_state_seconds: number;
            };
        };
        readiness_data: {
            readiness: number;
            recovery_level: number;
        };
    }>;
    type: 'sleep';
}

export interface TerraBodyPayload {
    user: TerraUser;
    data: Array<{
        metadata: {
            end_time: string;
            start_time: string;
        };
        measurements_data: {
            composition: {
                body_fat_percentage: number;
                muscle_mass_g: number;
                bone_mass_g: number;
                water_percentage: number;
            };
        };
    }>;
    type: 'body';
}

export interface TerraDailyPayload {
    user: TerraUser;
    data: Array<{
        metadata: {
            end_time: string;
            start_time: string;
        };
        scores: {
            recovery: number;
            activity: number;
            sleep: number;
        };
    }>;
    type: 'daily';
}

export type TerraWebhookPayload =
    | TerraActivityPayload
    | TerraSleepPayload
    | TerraBodyPayload
    | TerraDailyPayload;
