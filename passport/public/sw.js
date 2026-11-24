// The build (vite.config.js, meyar-precache-sw) replaces CACHE_NAME and CORE_URLS with the real file list.
const CACHE_NAME = 'meyar-passport-offline-dev';
const CORE_URLS = [
  '/',
  '/index.html',
  '/scan.html',
  '/demo/demo-001.contract.json',
  '/demo/demo-002.contract.json',
  '/demo/demo-006.contract.json',
];

// Install (REVIEW): the pages, code, fonts and demo data are cached all-or-nothing. If any of them fails,
// the install fails and the previous worker keeps its working offline cache (activate would otherwise
// delete it). Illustrations are cached best-effort, so a slow image never costs the patient offline access.
self.addEventListener('install', (event) => {
  const isMedia = (u) => u.startsWith('/imagery/');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(CORE_URLS.filter((u) => !isMedia(u)));
        await Promise.allSettled(CORE_URLS.filter(isMedia).map((u) => cache.add(u)));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(url.pathname.includes('scan') ? '/scan.html' : '/index.html'));
    })
  );
});
