import type { Metadata } from 'next';
import VitalsMonitorClient from './VitalsMonitorClient';

export const metadata: Metadata = {
    title: 'Vitals Monitor | Vitals.AI',
    description:
        'Real-time health vitals monitoring — heart rate, HRV, respiratory rate, blood oxygen, skin temperature, stress index, and blood pressure. Powered by WHOOP 5.0 and advanced biosensors.',
};

export default function VitalsPage() {
    return <VitalsMonitorClient />;
}
