import type { Metadata } from 'next';
import DeviceHubClient from './DeviceHubClient';

export const metadata: Metadata = {
    title: 'Device Hub | Vitals.AI',
    description:
        'Connect and manage your 2026 health hardware devices — WHOOP, Apple Watch, Oura Ring, Withings, Samsung Galaxy Watch, Google Fit, and more.',
};

export default function DeviceHubPage() {
    return <DeviceHubClient />;
}
