// The build (vite.config.js, meyar-precache-sw) replaces CACHE_NAME and CORE_URLS with the real file list.
const CACHE_NAME = 'meyar-passport-offline-b42003a3';
const CORE_URLS = [
  '/',
  '/assets/Alexandria-100-900-arabic-BMWQQIfH.woff2',
  '/assets/Alexandria-100-900-latin-9GNYQ01K.woff2',
  '/assets/IBMPlexMono-400-latin-B6RhGwqP.woff2',
  '/assets/IBMPlexMono-500-latin-DCk7SIos.woff2',
  '/assets/IBMPlexMono-600-latin-BIgdCK9e.woff2',
  '/assets/IBMPlexSansArabic-400-arabic-CyU-ddYS.woff2',
  '/assets/IBMPlexSansArabic-400-latin-Bo5KPYvw.woff2',
  '/assets/IBMPlexSansArabic-500-arabic-C4MQITzh.woff2',
  '/assets/IBMPlexSansArabic-500-latin-Cd6jVIg7.woff2',
  '/assets/IBMPlexSansArabic-600-arabic-0pRdybE_.woff2',
  '/assets/IBMPlexSansArabic-600-latin-KrqB56Mw.woff2',
  '/assets/IBMPlexSansArabic-700-arabic-DrtBj6UE.woff2',
  '/assets/IBMPlexSansArabic-700-latin-BzSf6GNr.woff2',
  '/assets/ReadexPro-160-700-arabic-DiwT_uOQ.woff2',
  '/assets/ReadexPro-160-700-latin--ekFhJJC.woff2',
  '/assets/index-BuPrZJPo.css',
  '/assets/index-CC76xAkd.js',
  '/assets/main-DY5TfttU.js',
  '/assets/scan-DuN4lH5t.js',
  '/demo/demo-001.contract.json',
  '/demo/demo-002.contract.json',
  '/demo/demo-006.contract.json',
  '/imagery/img-02-1920.webp',
  '/imagery/img-02-640.webp',
  '/imagery/img-02.webp',
  '/imagery/img-06-1920.webp',
  '/imagery/img-06-640.webp',
  '/imagery/img-06.webp',
  '/imagery/img-14-1920.webp',
  '/imagery/img-14-640.webp',
  '/imagery/img-14.webp',
  '/imagery/img-15-1920.webp',
  '/imagery/img-15-640.webp',
  '/imagery/img-15.webp',
  '/index.html',
  '/scan.html'
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
