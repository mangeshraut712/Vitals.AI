import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { TerraWebhookPayload } from '@/lib/terra/types';
import prisma from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Verify Terra Webhook signature
function verifySignature(signature: string | null, payload: string, secret: string | undefined): boolean {
    if (!signature || !secret) return false;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');
    const receivedSignature = signature.trim();

    const expected = Buffer.from(calculatedSignature, 'utf8');
    const received = Buffer.from(receivedSignature, 'utf8');

    if (expected.length !== received.length) {
        return false;
    }

    try {
        // Use timingSafeEqual to prevent timing attacks.
        return crypto.timingSafeEqual(received, expected);
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const secret = process.env.TERRA_API_SECRET;
    const strictSignatureMode = process.env.TERRA_WEBHOOK_STRICT === 'true';

    // Basic validation of secret presence
    if (!secret) {
        console.warn('[Terra Webhook] Missing TERRA_API_SECRET');
        // Still process for demo purposes, but log warning
    }

    try {
        const rawBody = await request.text();
        const signature = request.headers.get('terra-signature');

        // Verify signature if secret is set
        if (secret && !verifySignature(signature, rawBody, secret)) {
            console.error('[Terra Webhook] Invalid signature');
            if (strictSignatureMode) {
                return NextResponse.json({
                    status: 'ignored',
                    reason: 'invalid_signature',
                    httpStatus: 401,
                });
            }

            // Non-strict mode: avoid hard failures in local/dev environments.
            return NextResponse.json({
                status: 'ignored',
                reason: 'invalid_signature',
                httpStatus: 202,
            });
        }

        const payload = JSON.parse(rawBody) as TerraWebhookPayload;
        if (!payload?.type || !payload?.user?.provider || !Array.isArray(payload.data)) {
            return NextResponse.json({
                status: 'ignored',
                reason: 'invalid_payload_structure',
                httpStatus: 400,
            });
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
            return NextResponse.json({
                status: 'ignored',
                reason: 'invalid_json_payload',
                httpStatus: 400,
            });
        }

        return NextResponse.json({
            status: 'ignored',
            reason: 'processing_error',
        });
    }
}
