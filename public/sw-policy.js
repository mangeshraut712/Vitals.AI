const MAX_DYNAMIC_CACHE_ENTRIES = 60;

export function maxDynamicCacheEntries() {
  return MAX_DYNAMIC_CACHE_ENTRIES;
}

export function isCacheableRequest(requestUrl, pageOrigin) {
  let url;
  try {
    url = new URL(requestUrl);
  } catch {
    return false;
  }

  if (url.origin !== pageOrigin) return false;
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  if (url.pathname.includes('/api/')) return false;
  return true;
}

export function notificationUrl(raw, pageOrigin, fallbackPath) {
  const fallback = new URL(fallbackPath, pageOrigin).toString();
  if (typeof raw !== 'string' || !raw.trim()) return fallback;

  try {
    const parsed = new URL(raw, pageOrigin);
    if (parsed.origin !== pageOrigin) return fallback;
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return fallback;
    return parsed.toString();
  } catch {
    return fallback;
  }
}
