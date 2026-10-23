import crypto from 'crypto';

interface RequestLike {
  headers: Headers;
}

interface GuardEnv {
  NODE_ENV?: string;
  VITALS_API_TOKEN?: string;
}

function tokensMatch(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

/**
 * Privileged routes clear caches, spend model credits, or forward health events.
 * Development and test can call them locally. Production requires a bearer token.
 */
export function isPrivilegedRequest(
  request?: RequestLike | null,
  env: GuardEnv = process.env
): boolean {
  if (env.NODE_ENV !== 'production') return true;

  const token = env.VITALS_API_TOKEN?.trim();
  if (!token || !request) return false;

  const header = request.headers.get('authorization')?.trim() ?? '';
  return tokensMatch(header, `Bearer ${token}`);
}

export function clientRateLimitKey(request: RequestLike, bucket: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const ip = /^[a-fA-F0-9:.]+$/.test(forwarded) && forwarded.length <= 64 ? forwarded : 'unknown';
  return `${bucket}:${ip}`;
}
