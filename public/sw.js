self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handler de fetch (passthrough) — alguns navegadores só consideram o app
// "instalável" se o service worker responder a fetch, mesmo sem cache real.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
