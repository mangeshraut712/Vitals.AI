import crypto from 'crypto';

const MAX_SKEW_MS = 5 * 60 * 1000;

export type TerraSignatureFailure =
  | 'missing_secret'
  | 'missing_signature'
  | 'invalid_timestamp'
  | 'stale_timestamp'
  | 'invalid_signature';

export interface TerraSignatureResult {
  ok: boolean;
  reason?: TerraSignatureFailure;
}

function safeEqualHex(expected: string, received: string): boolean {
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
}

function hmacHex(secret: string, value: string): string {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

/**
 * Verify a Terra webhook signature.
 *
 * Terra sends `terra-signature: t=<unix>,v1=<hex>` and signs `${t}.${rawBody}`.
 * A bare 64-char hex HMAC of the raw body is also accepted for older callers.
 */
export function verifyTerraSignature(
  signatureHeader: string | null,
  payload: string,
  secret: string | undefined,
  now = Date.now()
): TerraSignatureResult {
  if (!secret) return { ok: false, reason: 'missing_secret' };
  if (!signatureHeader?.trim()) return { ok: false, reason: 'missing_signature' };

  let timestamp: string | undefined;
  const signatures: string[] = [];

  for (const part of signatureHeader.split(',')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key === 't') timestamp = value;
    if (key === 'v1' && /^[a-f0-9]{64}$/i.test(value)) signatures.push(value.toLowerCase());
  }

  if (timestamp || signatures.length > 0) {
    if (!timestamp || !/^\d{10,13}$/.test(timestamp)) {
      return { ok: false, reason: 'invalid_timestamp' };
    }

    const timestampMs = timestamp.length >= 13 ? Number(timestamp) : Number(timestamp) * 1000;
    if (!Number.isFinite(timestampMs) || Math.abs(now - timestampMs) > MAX_SKEW_MS) {
      return { ok: false, reason: 'stale_timestamp' };
    }

    if (signatures.length === 0) return { ok: false, reason: 'invalid_signature' };

    const expected = hmacHex(secret, `${timestamp}.${payload}`);
    const matched = signatures.some((signature) => safeEqualHex(expected, signature));
    return matched ? { ok: true } : { ok: false, reason: 'invalid_signature' };
  }

  const bare = signatureHeader.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(bare)) return { ok: false, reason: 'invalid_signature' };

  const expected = hmacHex(secret, payload);
  return safeEqualHex(expected, bare) ? { ok: true } : { ok: false, reason: 'invalid_signature' };
}
