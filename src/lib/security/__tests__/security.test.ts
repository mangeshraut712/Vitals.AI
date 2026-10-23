import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import {
  assessOutboundUrl,
  checkRateLimit,
  getRateLimitKeyCount,
  redactSensitiveText,
  resetRateLimits,
  sanitizeUrl,
} from '@/lib/security';
import { isPrivilegedRequest } from '@/lib/security/request-guard';
import { POST as postChat } from '@/app/api/chat/route';
import { POST as postCacheClear } from '@/app/api/cache/clear/route';

describe('outbound URL checks', () => {
  it('allows public https URLs and rejects local, metadata, and ambiguous hosts', () => {
    expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl('http://127.0.0.1/latest')).toBeNull();
    expect(sanitizeUrl('http://[::1]/')).toBeNull();
    expect(sanitizeUrl('http://169.254.169.254/latest/meta-data')).toBeNull();
    expect(sanitizeUrl('http://2130706433/')).toBeNull();
    expect(sanitizeUrl('http://10.0.0.5/')).toBeNull();
    expect(assessOutboundUrl('http://127.0.0.1:8080', { allowLoopback: true }).ok).toBe(true);
    expect(assessOutboundUrl('https://example.com').ok).toBe(true);
  });
});

describe('rate limiting', () => {
  it('blocks once the window is exhausted and caps stored keys', () => {
    resetRateLimits();
    expect(checkRateLimit('chat:one', 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit('chat:one', 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit('chat:one', 2, 60_000).allowed).toBe(false);

    for (let index = 0; index < 5005; index += 1) {
      checkRateLimit(`burst:${index}`, 5, 60_000);
    }
    expect(getRateLimitKeyCount()).toBeLessThanOrEqual(5000);
    resetRateLimits();
  });
});

describe('privileged routes', () => {
  it('requires a bearer token in production and redacts secrets', () => {
    const request = new NextRequest('http://example.com/api/cache/clear', { method: 'POST' });
    expect(isPrivilegedRequest(request, { NODE_ENV: 'production' })).toBe(false);
    expect(isPrivilegedRequest(request, { NODE_ENV: 'test' })).toBe(true);
    expect(isPrivilegedRequest(
      new NextRequest('http://example.com/api/cache/clear', {
        method: 'POST',
        headers: { authorization: 'Bearer secret-token' },
      }),
      { NODE_ENV: 'production', VITALS_API_TOKEN: 'secret-token' }
    )).toBe(true);
    expect(redactSensitiveText('failed with sk-or-v1-abc123def456')).toContain('[redacted]');
  });

  it('rejects unauthenticated production cache clears', async () => {
    const env = process.env as Record<string, string | undefined>;
    const originalEnv = env.NODE_ENV;
    const originalToken = env.VITALS_API_TOKEN;
    env.NODE_ENV = 'production';
    delete env.VITALS_API_TOKEN;

    const response = await postCacheClear(new NextRequest('https://vitals.example/api/cache/clear', {
      method: 'POST',
    }));

    expect(response.status).toBe(401);
    env.NODE_ENV = originalEnv;
    if (originalToken === undefined) delete env.VITALS_API_TOKEN;
    else env.VITALS_API_TOKEN = originalToken;
  });
});

describe('chat validation', () => {
  it('returns 400 for malformed JSON instead of a successful stream', async () => {
    const response = await postChat(new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: '{',
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(400);
    const payload = await response.json() as { error?: string };
    expect(payload.error).toBe('Invalid request payload.');
  });
});
