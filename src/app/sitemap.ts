import type { MetadataRoute } from 'next';

function getBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    'http://localhost:3000';

  return base.startsWith('http') ? base : `https://${base}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const routes = [
    '',
    '/dashboard',
    '/biomarkers',
    '/body-comp',
    '/lifestyle',
    '/goals',
    '/data-sources',
    '/future',
    '/tools/agent',
    '/tools/guides',
    '/tools/disclaimers',
    '/plans/diet',
    '/plans/exercise',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
}
