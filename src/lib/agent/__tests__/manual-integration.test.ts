
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { HealthEvent } from '@/lib/types/health-events';

// Manual parser for .env.local to ensure secrets are loaded
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0 && !key.startsWith('#')) {
            const val = values.join('=').trim().replace(/(^"|"$)/g, '');
            if (val) process.env[key.trim()] = val;
        }
    });
}

describe('Manual Integration Tests', () => {

    it('should query OpenRouter agent', async () => {
        if (!process.env.OPENROUTER_API_KEY) {
            console.warn('Skipping OpenRouter test: No API Key found in env');
            return;
        }

        const { queryHealthAgent } = await import('@/lib/agent/health-agent');

        const mockHealthContext = `
      - Age: 42
      - Biomarkers: optimized (CRP < 0.3)
      - Goal: Longevity
    `;

        console.log('Querying OpenRouter agent...');
        const response = await queryHealthAgent('What is a good CRP level for longevity? Keep it very brief.', mockHealthContext);

        if (response.error) {
            console.error('OpenRouter Error:', response.error);
        } else {
            console.log('OpenRouter Response:', response.content);
        }

        expect(response.content).toBeTruthy();
        expect(response.error).toBeUndefined();
    }, 30000);

    it('should dispatch to OpenClaw', async () => {
        const openClawEnabled = process.env.OPENCLAW_ENABLED?.trim().toLowerCase() === 'true';
        if (!openClawEnabled) {
            console.warn('Skipping OpenClaw dispatch test: OPENCLAW_ENABLED is not true');
            return;
        }

        if (!process.env.OPENCLAW_HOOKS_TOKEN?.trim()) {
            console.warn('Skipping OpenClaw dispatch test: OPENCLAW_HOOKS_TOKEN is not configured');
            return;
        }

        const { dispatchHealthEventsToOpenClaw } = await import('@/lib/integrations/openclaw');

        const mockEvent: HealthEvent = {
            id: 'test-event-' + Date.now(),
            domain: 'biomarker',
            severity: 'warning',
            source: 'bloodwork',
            metric: 'hs-CRP',
            occurredAt: new Date().toISOString(),
            recordedAt: new Date().toISOString(),
            confidence: 0.9,
            status: 'new',
            summary: 'Elevated hs-CRP detected (2.5 mg/L)',
            value: 2.5,
            unit: 'mg/L',
            metadata: { reference: '<1.0' }
        };

        console.log('Dispatching to OpenClaw...');
        // We expect this might fail if the local server isn't running, but we want to see the attempt logic work.
        const result = await dispatchHealthEventsToOpenClaw([mockEvent], { limit: 1 });

        console.log('Dispatch Result:', {
            attempted: result.attempted,
            delivered: result.delivered,
            reason: result.reason,
            error: result.error,
            endpoint: result.endpoint
        });

        expect(result.attempted).toBe(true);
    });
});
