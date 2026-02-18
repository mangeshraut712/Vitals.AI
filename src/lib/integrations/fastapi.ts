const DEFAULT_FASTAPI_CHAT_PATH = '/chat/stream';
const DEFAULT_FASTAPI_HEALTH_PATH = '/health';
const DEFAULT_FASTAPI_TIMEOUT_MS = 15_000;

export interface FastApiConfig {
  baseUrl: string;
  chatPath: string;
  healthPath: string;
  timeoutMs: number;
  apiToken?: string;
}

export interface FastApiHealthResult {
  ok: boolean;
  latency: number;
  message: string;
}

function normalizePath(pathname: string, fallback: string): string {
  const trimmed = pathname.trim();
  if (!trimmed) return fallback;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function normalizeBaseUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function getFastApiConfig(): FastApiConfig | null {
  const baseUrl = normalizeBaseUrl(process.env.FASTAPI_BASE_URL ?? '');
  if (!baseUrl) {
    return null;
  }

  const timeoutFromEnv = Number.parseInt(process.env.FASTAPI_TIMEOUT_MS ?? '', 10);
  const timeoutMs = Number.isFinite(timeoutFromEnv) && timeoutFromEnv > 0
    ? timeoutFromEnv
    : DEFAULT_FASTAPI_TIMEOUT_MS;

  return {
    baseUrl,
    chatPath: normalizePath(process.env.FASTAPI_CHAT_PATH ?? '', DEFAULT_FASTAPI_CHAT_PATH),
    healthPath: normalizePath(process.env.FASTAPI_HEALTH_PATH ?? '', DEFAULT_FASTAPI_HEALTH_PATH),
    timeoutMs,
    apiToken: process.env.FASTAPI_API_TOKEN?.trim() || undefined,
  };
}

function buildHeaders(config: FastApiConfig): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiToken) {
    headers.Authorization = `Bearer ${config.apiToken}`;
  }

  return headers;
}

export async function requestFastApiChat(
  message: string,
  healthContext: string
): Promise<Response | null> {
  const config = getFastApiConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    return await fetch(`${config.baseUrl}${config.chatPath}`, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        message,
        healthContext,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function pingFastApi(): Promise<FastApiHealthResult> {
  const config = getFastApiConfig();
  if (!config) {
    return {
      ok: false,
      latency: 0,
      message: 'FASTAPI_BASE_URL is not configured',
    };
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${config.baseUrl}${config.healthPath}`, {
      method: 'GET',
      headers: config.apiToken ? { Authorization: `Bearer ${config.apiToken}` } : undefined,
      signal: controller.signal,
      cache: 'no-store',
    });

    const latency = Date.now() - startedAt;
    if (response.ok) {
      return {
        ok: true,
        latency,
        message: `FastAPI proxy reachable (${config.baseUrl})`,
      };
    }

    return {
      ok: false,
      latency,
      message: `FastAPI health returned HTTP ${response.status}`,
    };
  } catch (error) {
    const latency = Date.now() - startedAt;
    return {
      ok: false,
      latency,
      message: error instanceof Error ? error.message : 'FastAPI health request failed',
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}
