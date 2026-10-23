export interface OutboundUrlPolicy {
  allowLoopback?: boolean;
  allowPrivate?: boolean;
}

export type OutboundUrlAssessment =
  | {
      ok: true;
      url: string;
      hostname: string;
      loopback: boolean;
      privateNetwork: boolean;
    }
  | {
      ok: false;
      reason:
        | 'invalid_url'
        | 'unsupported_protocol'
        | 'embedded_credentials'
        | 'blocked_host';
    };

const METADATA_HOSTS = new Set([
  'metadata.google.internal',
  'metadata.internal',
  'instance-data',
]);

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '');
}

function parseDottedIpv4(hostname: string): number | null {
  const parts = hostname.split('.');
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    if (part.length > 1 && part.startsWith('0')) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = (value * 256) + octet;
  }

  return value >>> 0;
}

function parseDecimalIpv4(hostname: string): number | null {
  if (!/^\d{8,10}$/.test(hostname)) return null;
  const value = Number(hostname);
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) return null;
  return value >>> 0;
}

function ipv4Class(value: number): 'loopback' | 'private' | 'link-local' | 'unspecified' | 'public' {
  const a = (value >>> 24) & 0xff;
  const b = (value >>> 16) & 0xff;
  if (a === 0) return 'unspecified';
  if (a === 127) return 'loopback';
  if (a === 10) return 'private';
  if (a === 172 && b >= 16 && b <= 31) return 'private';
  if (a === 192 && b === 168) return 'private';
  if (a === 169 && b === 254) return 'link-local';
  if (a === 100 && b >= 64 && b <= 127) return 'private';
  return 'public';
}

function ipv4MappedAddress(hostname: string): string | null {
  const match = hostname.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  return match ? match[1] : null;
}

function isIpv6Loopback(hostname: string): boolean {
  return hostname === '::1' || hostname === '0:0:0:0:0:0:0:1';
}

function isIpv6LinkLocal(hostname: string): boolean {
  return hostname.includes(':') && /^fe[89ab][0-9a-f]{0,2}:/i.test(hostname);
}

function isIpv6UniqueLocal(hostname: string): boolean {
  return hostname.includes(':') && /^f[cd][0-9a-f]{0,2}:/i.test(hostname);
}

export function assessOutboundUrl(
  raw: string,
  policy: OutboundUrlPolicy = {}
): OutboundUrlAssessment {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: 'invalid_url' };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'embedded_credentials' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'unsupported_protocol' };
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (!hostname || hostname.includes('%')) {
    return { ok: false, reason: 'blocked_host' };
  }

  const mapped = ipv4MappedAddress(hostname);
  const ipHost = mapped ?? hostname;
  const ipv4 = parseDottedIpv4(ipHost) ?? parseDecimalIpv4(ipHost);
  let loopback = hostname === 'localhost' || hostname.endsWith('.localhost') || isIpv6Loopback(hostname);
  let privateNetwork = hostname.endsWith('.local') || isIpv6UniqueLocal(hostname);
  let blocked = METADATA_HOSTS.has(hostname) || isIpv6LinkLocal(hostname);

  if (ipv4 !== null) {
    const kind = ipv4Class(ipv4);
    if (kind === 'loopback') loopback = true;
    if (kind === 'private') privateNetwork = true;
    if (kind === 'link-local' || kind === 'unspecified') blocked = true;
  } else if (/^\d+\.\d+\.\d+$/.test(hostname) || /^\d+$/.test(hostname)) {
    blocked = true;
  }

  if (blocked) return { ok: false, reason: 'blocked_host' };
  if (loopback && !policy.allowLoopback) return { ok: false, reason: 'blocked_host' };
  if (privateNetwork && !policy.allowPrivate) return { ok: false, reason: 'blocked_host' };

  parsed.hash = '';
  parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  const url = parsed.toString().replace(/\/+$/, '');
  return { ok: true, url, hostname, loopback, privateNetwork };
}
