import { SUPPORTED_DEVICES } from '@/features/sync/types';

export const DEMO_FUTURE_STATS = {
  healthScore: 92,
  prevHealthScore: 88,
  hrvStatus: 'peak',
  glucose: {
    current: 98,
    trend: 'stable',
    history: [95, 96, 99, 98, 97, 98, 98],
  },
  coaching: {
    message:
      "Based on your Oura Sleep Score (85) and Morning HRV (62ms), you've fully recovered from yesterday's strain. Suggested workout: Zone 2 Endurance Run (45 mins).",
    metrics: {
      sleep: 85,
      hrv: 62,
    },
  },
  community: {
    rank: 'top 5%',
    metric: 'recovery',
  },
  devices: SUPPORTED_DEVICES,
};
