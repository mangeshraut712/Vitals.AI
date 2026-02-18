
import { NextResponse } from 'next/server';
import { queryHealthAgent } from '@/lib/agent/health-agent';
import { dispatchHealthEventsToOpenClaw } from '@/lib/integrations/openclaw';
import { getFastApiConfig, pingFastApi } from '@/lib/integrations/fastapi';
import { HealthEvent } from '@/lib/types/health-events';

export const dynamic = 'force-dynamic';

function okResult(message: string, latency: number) {
    return { status: 'ok' as const, message, latency };
}

function degradedMessage(detail: string): string {
    return `Operational (degraded): ${detail}`;
}

export async function GET() {
    const results = {
        openRouter: okResult('Pending', 0),
        openClaw: okResult('Pending', 0),
    };

    // Test OpenRouter (Parallel execution often fails with limits, so sequential is safer for diagnostics)

    // 1. OpenRouter
    try {
        const fastApiConfig = getFastApiConfig();
        if (fastApiConfig) {
            const fastApiResult = await pingFastApi();
            if (fastApiResult.ok) {
                results.openRouter = okResult(fastApiResult.message, fastApiResult.latency);
            } else {
                results.openRouter = okResult(
                    degradedMessage(fastApiResult.message),
                    fastApiResult.latency
                );
            }
        } else {
            const apiKey = process.env.OPENROUTER_API_KEY?.trim();
            if (!apiKey) {
                results.openRouter = okResult(
                    degradedMessage('OPENROUTER_API_KEY is not configured'),
                    0
                );
            } else {
                const start = Date.now();
                const agentRes = await queryHealthAgent('Respond with "pong".', 'Diagnostic Check');
                const latency = Date.now() - start;

                if (agentRes.error) {
                    results.openRouter = okResult(degradedMessage(agentRes.error), latency);
                } else {
                    results.openRouter = okResult('Success', latency);
                }
            }
        }
    } catch (e) {
        results.openRouter = okResult(
            degradedMessage(e instanceof Error ? e.message : 'Unknown error'),
            0
        );
    }

    // 2. OpenClaw
    try {
        const start = Date.now();
        const testEvent: HealthEvent = {
            id: `diag-${Date.now()}`,
            domain: 'system',
            severity: 'info',
            source: 'system',
            metric: 'diagnostic_ping',
            value: 1,
            unit: 'ping',
            summary: 'System Diagnostic Ping',
            occurredAt: new Date().toISOString(),
            recordedAt: new Date().toISOString(),
            confidence: 1.0,
            status: 'diagnostic'
        };

        const clawRes = await dispatchHealthEventsToOpenClaw([testEvent], {
            limit: 1,
            severities: ['info', 'warning', 'critical']
        });

        const latency = Date.now() - start;

        if (clawRes.error) {
            results.openClaw = okResult(degradedMessage(clawRes.error), latency);
        } else if (clawRes.reason) {
            results.openClaw = okResult(
                degradedMessage(`Not delivered: ${clawRes.reason}`),
                latency
            );
        } else {
            results.openClaw = okResult('Delivered', latency);
        }
    } catch (e) {
        results.openClaw = okResult(
            degradedMessage(e instanceof Error ? e.message : 'Unknown error'),
            0
        );
    }

    return NextResponse.json(results);
}
