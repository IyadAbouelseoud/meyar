// F6 reader service worker: caches the reader and everything it imports so it reloads offline.
// Same-origin only. Works on localhost and HTTPS (service workers need a secure context).
const CACHE = 'meyar-f6-reader-v1';
const CORE = ['./', './index.html', './reader.js', './reader.css', './qrcode-stub.js',
  '../passport-src/qr.js', '../passport-src/pinguard.js', '../vendor/jsQR.js',
  '../design/fonts/fonts.css', '../design/tokens.css', '../design/meyar.css', '../design/meyar.js',
  '../demo-out/demo-001.qr.svg', '../demo-out/demo-001-tampered.qr.svg'];

self.addEventListener('install', (e) => e.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(CORE);
  const css = await (await fetch('../design/fonts/fonts.css')).text();
  const fonts = [...css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)].map((m) => new URL(m[1], new URL('../design/fonts/', self.location)).href);
  await cache.addAll(fonts);
  self.skipWaiting();
})()));
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});
