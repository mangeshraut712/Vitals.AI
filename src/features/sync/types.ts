export interface DeviceIntegration {
    name: string;
    type: 'wearable' | 'scale' | 'blood_pressure' | 'glucose_monitor';
    status: 'connected' | 'disconnected' | 'syncing';
    lastSync: Date;
    batteryLevel?: number;
}

export interface RealTimeMetric {
    id: string;
    label: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    zone: 'recovery' | 'fat_burn' | 'cardio' | 'peak';
}

export const SUPPORTED_DEVICES: DeviceIntegration[] = [
    { name: 'Apple Watch Ultra', type: 'wearable', status: 'connected', lastSync: new Date(), batteryLevel: 85 },
    { name: 'Oura Ring Gen 4', type: 'wearable', status: 'syncing', lastSync: new Date(Date.now() - 300000), batteryLevel: 40 },
    { name: 'Withings Body Comp', type: 'scale', status: 'disconnected', lastSync: new Date(Date.now() - 86400000) },
    { name: 'Ultrahuman M1', type: 'glucose_monitor', status: 'connected', lastSync: new Date(), batteryLevel: 92 },
];
