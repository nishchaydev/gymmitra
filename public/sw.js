const CACHE_NAME = 'gym-mitra-cache-v3';
const OFFLINE_URL = '/offline';

const PRECACHE_ASSETS = [
    '/',
    OFFLINE_URL,
    '/manifest.webmanifest',
    '/favicon.ico',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[PWA] Precaching critical assets');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[PWA] Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // 1. Navigation requests - Network First, Fallback to Offline
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Update cache with the latest version of the page
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                    return response;
                })
                .catch(() => {
                    // If network fails, try cache, then offline page
                    return caches.match(event.request).then(response => {
                        return response || caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    // 2. Static Assets (JS, CSS, Images) - Stale While Revalidate
    const isStaticAsset = 
        url.origin === self.location.origin && 
        (url.pathname.startsWith('/_next/static/') || 
         url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2)$/));

    if (isStaticAsset) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchedResponse = fetch(event.request).then(networkResponse => {
                    if (networkResponse.ok) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                    }
                    return networkResponse;
                }).catch(() => null);

                return cachedResponse || fetchedResponse;
            })
        );
        return;
    }

    // 3. API calls (GET only)
    // SECURITY: never cache authenticated tenant APIs in service worker.
    // Cache only explicitly public read-only APIs.
    const isCacheablePublicApiGet =
        url.origin === self.location.origin &&
        event.request.method === 'GET' &&
        (
            url.pathname.startsWith('/api/public/') ||
            url.pathname === '/api/health'
        );

    if (isCacheablePublicApiGet) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchedResponse = fetch(event.request).then(networkResponse => {
                    if (networkResponse.ok && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                    }
                    return networkResponse;
                }).catch(() => {
                    // Silent fail for network - if we have cache, we use it
                    console.log('[PWA] API Fetch failed (offline), serving from cache if available');
                    return null;
                });

                return cachedResponse || fetchedResponse;
            })
        );
        return;
    }

    // 4. Everything else - Network Only (handled by browser default)
});
