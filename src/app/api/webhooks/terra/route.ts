import { NextRequest, NextResponse } from 'next/server';
import type { TerraWebhookPayload } from '@/lib/terra/types';
import { verifyTerraSignature } from '@/lib/terra/signature';
import prisma from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_WEBHOOK_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<NextResponse> {
    const secret = process.env.TERRA_API_SECRET?.trim();

    if (!secret) {
        console.warn('[Terra Webhook] Missing TERRA_API_SECRET');
        return NextResponse.json(
            { status: 'error', reason: 'missing_secret' },
            { status: 401 }
        );
    }

    try {
        const rawBody = await request.text();
        if (rawBody.length > MAX_WEBHOOK_BYTES) {
            return NextResponse.json(
                { status: 'ignored', reason: 'payload_too_large' },
                { status: 413 }
            );
        }

        const signature = request.headers.get('terra-signature');
        const verification = verifyTerraSignature(signature, rawBody, secret);
        if (!verification.ok) {
            console.error('[Terra Webhook] Rejected request:', verification.reason);
            return NextResponse.json(
                { status: 'ignored', reason: verification.reason },
                { status: 401 }
            );
        }

        const payload = JSON.parse(rawBody) as TerraWebhookPayload;
        if (!payload?.type || !payload?.user?.provider || !Array.isArray(payload.data)) {
            return NextResponse.json(
                { status: 'ignored', reason: 'invalid_payload_structure' },
                { status: 400 }
            );
        }

        const type = payload.type;
        console.log(`[Terra Webhook] Received ${type} event from ${payload.user.provider}`);

        // Process based on type
        if (type === 'activity' || type === 'daily') {
            // Handle activity/daily data
            // This is a simplified handler - in production would map all fields
            const data = payload.data[0];
            if (!data) return NextResponse.json({ status: 'ok' });

            // Identify user - for now assume single user or match by provider ID
            // In production: const user = await prisma.user.findFirst({ where: { devices: { some: { providerId: payload.user.user_id } } } });
            const user = await prisma.user.findFirst({
                select: { id: true },
            }) as { id: string } | null;

            if (user) {
                // Create or update ActivityRecord
                // Note: This logic needs to be robust to handle partial updates
                // For now, we log the intent
                console.log(`[Terra Webhook] Would update activity for user ${user.id}`);
            }
        } else if (type === 'body') {
            // Handle body composition
            // Similar user lookup
            const user = await prisma.user.findFirst({
                select: { id: true },
            }) as { id: string } | null;
            if (user) {
                console.log(`[Terra Webhook] Would update body composition for user ${user.id}`);
            }
        }


        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('[Terra Webhook] Processing failed:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { status: 'ignored', reason: 'invalid_json_payload' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { status: 'error', reason: 'processing_error' },
            { status: 500 }
        );
    }
}
