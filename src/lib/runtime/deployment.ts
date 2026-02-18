export function isVercelRuntime(): boolean {
  return process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
}

function normalizeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function getSiteUrl(): string | undefined {
  const explicit = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit;

  const production = normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (production) return production;

  const vercelUrl = normalizeUrl(process.env.VERCEL_URL);
  if (vercelUrl) return vercelUrl;

  return undefined;
}

export function getOpenRouterHeaders(
  defaultAppName = 'OpenHealth (Vitals.AI)'
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Title': process.env.OPENROUTER_APP_NAME?.trim() || defaultAppName,
  };

  const referer = getSiteUrl();
  if (referer) {
    headers['HTTP-Referer'] = referer;
  }

  return headers;
}

export function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.startsWith('127.')
  );
}

export function isLoopbackUrl(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return isLoopbackHost(parsed.hostname);
  } catch {
    return false;
  }
}
