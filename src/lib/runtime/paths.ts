/**
 * Public URL helpers for GitHub Pages project sites (`basePath` / `assetPrefix`).
 */
export function getBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return raw.replace(/\/$/, '');
}

export function withBasePath(path: string): string {
  const base = getBasePath();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function isGitHubPagesExport(): boolean {
  return process.env.GITHUB_PAGES === '1' || process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';
}
