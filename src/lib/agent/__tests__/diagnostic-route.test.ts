
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Simple env loader
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

describe('Diagnostic API Route', () => {
    it('should run diagnostics for OpenRouter and OpenClaw', async () => {
        const { GET } = await import('@/app/api/agent/diagnostics/route');
        const response = await GET();
        const data = await response.json();

        console.log('Diagnostic Results:', JSON.stringify(data, null, 2));

        expect(data).toHaveProperty('openRouter');
        expect(data).toHaveProperty('openClaw');

        if (process.env.OPENROUTER_API_KEY) {
            if (data.openRouter.status !== 'ok') {
                console.error('OpenRouter Failed:', data.openRouter.message);
            }
            expect(data.openRouter.status).toBe('ok');
        }

        expect(data.openClaw.status).toBeDefined();
    }, 60000);
});
