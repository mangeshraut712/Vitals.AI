// Vitals.AI Service Worker for PWA offline support
import { isCacheableRequest, maxDynamicCacheEntries, notificationUrl } from './sw-policy.js';

const CACHE_NAME = 'vitals-ai-v3';
const STATIC_CACHE_NAME = 'vitals-ai-static-v3';
const DYNAMIC_CACHE_NAME = 'vitals-ai-dynamic-v3';

const BASE_PATH = self.location.pathname.replace(/\/sw\.js$/, '') || '';

function withBase(path) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_PATH}${normalized}`;
}

const STATIC_ASSETS = [
    withBase('/'),
    withBase('/dashboard/'),
    withBase('/experience/'),
    withBase('/biomarkers/'),
    withBase('/body-comp/'),
    withBase('/vitals/'),
    withBase('/manifest.json'),
];

async function putLimited(cacheName, request, response) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    const keys = await cache.keys();
    const overflow = keys.length - maxDynamicCacheEntries();
    if (overflow > 0) {
        await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .catch((error) => {
                console.error('[SW] Failed to cache static assets:', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            return name !== STATIC_CACHE_NAME &&
                                name !== DYNAMIC_CACHE_NAME &&
                                name !== CACHE_NAME;
                        })
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    if (!isCacheableRequest(request.url, self.location.origin)) return;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok && response.type === 'basic') {
                        void putLimited(DYNAMIC_CACHE_NAME, request, response.clone());
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then((cachedResponse) => cachedResponse || caches.match(withBase('/')));
                })
        );
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                const network = fetch(request)
                    .then((response) => {
                        if (response.ok && response.type === 'basic') {
                            void putLimited(DYNAMIC_CACHE_NAME, request, response.clone());
                        }
                        return response;
                    });

                return cachedResponse || network;
            })
    );
});

self.addEventListener('push', (event) => {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch {
            data = { body: 'New health update available' };
        }
    }

    const title = typeof data.title === 'string' ? data.title : 'Vitals.AI';
    const target = notificationUrl(data.data?.url, self.location.origin, withBase('/dashboard/'));
    const options = {
        body: typeof data.body === 'string' ? data.body : 'New health update available',
        icon: withBase('/icons/health-icon.svg'),
        badge: withBase('/icons/health-badge.svg'),
        data: { url: target },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = notificationUrl(
        event.notification.data?.url,
        self.location.origin,
        withBase('/dashboard/')
    );

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow(urlToOpen);
            })
    );
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-health-data') {
        event.waitUntil(
            fetch(withBase('/api/sync'), { method: 'POST' })
                .then(() => console.log('[SW] Health data synced'))
                .catch((error) => console.error('[SW] Sync failed:', error))
        );
    }
});
