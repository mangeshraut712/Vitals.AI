import crypto from 'crypto';
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { verifyTerraSignature } from '../signature';
import { POST } from '@/app/api/webhooks/terra/route';

const SECRET = 'terra-test-secret';
const BODY = JSON.stringify({
  type: 'activity',
  user: { provider: 'GARMIN' },
  data: [{ heart_rate: 60 }],
});
const NOW = Date.parse('2026-10-23T12:00:00.000Z');

function signedHeader(body = BODY, timestamp = Math.floor(NOW / 1000)): string {
  const signature = crypto.createHmac('sha256', SECRET).update(`${timestamp}.${body}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

describe('verifyTerraSignature', () => {
  it('accepts the Terra t.v1 signature and rejects stale or missing signatures', () => {
    expect(verifyTerraSignature(signedHeader(), BODY, SECRET, NOW).ok).toBe(true);
    expect(verifyTerraSignature(signedHeader(BODY, Math.floor(NOW / 1000) - 600), BODY, SECRET, NOW).reason)
      .toBe('stale_timestamp');
    expect(verifyTerraSignature(null, BODY, SECRET, NOW).reason).toBe('missing_signature');
    expect(verifyTerraSignature(signedHeader(), BODY, undefined, NOW).reason).toBe('missing_secret');
    expect(verifyTerraSignature('t=1,v1=abcd', BODY, SECRET, NOW).reason).toBe('invalid_timestamp');
  });

  it('rejects a signature computed over the body alone when the header uses Terra format', () => {
    const wrong = crypto.createHmac('sha256', SECRET).update(BODY).digest('hex');
    const header = `t=${Math.floor(NOW / 1000)},v1=${wrong}`;
    expect(verifyTerraSignature(header, BODY, SECRET, NOW).reason).toBe('invalid_signature');
  });
});

describe('Terra webhook route', () => {
  it('does not accept events when the signing secret is missing', async () => {
    const original = process.env.TERRA_API_SECRET;
    delete process.env.TERRA_API_SECRET;

    const response = await POST(new NextRequest('http://localhost/api/webhooks/terra', {
      method: 'POST',
      body: BODY,
      headers: { 'terra-signature': signedHeader() },
    }));

    expect(response.status).toBe(401);
    const payload = await response.json() as { reason?: string };
    expect(payload.reason).toBe('missing_secret');

    if (original === undefined) delete process.env.TERRA_API_SECRET;
    else process.env.TERRA_API_SECRET = original;
  });

  it('returns 401 for an invalid signature instead of HTTP 200', async () => {
    process.env.TERRA_API_SECRET = SECRET;
    const response = await POST(new NextRequest('http://localhost/api/webhooks/terra', {
      method: 'POST',
      body: BODY,
      headers: { 'terra-signature': 't=1,v1=deadbeef' },
    }));

    expect(response.status).toBe(401);
  });
});
