import type { MetadataRoute } from 'next';
import { isGitHubPagesRuntime } from '@/lib/runtime/deployment';

export const dynamic = 'force-static';
export const revalidate = false;

function getBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    (isGitHubPagesRuntime() ? 'https://mangeshraut712.github.io/Vitals.AI' : undefined) ||
    'http://localhost:3000';

  return base.startsWith('http') ? base : `https://${base}`;
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  const isIndexable =
    process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview';

  return {
    rules: isIndexable
      ? {
          userAgent: '*',
          allow: '/',
        }
      : {
          userAgent: '*',
          disallow: '/',
        },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
