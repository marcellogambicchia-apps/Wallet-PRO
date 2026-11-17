/* Wallet-PRO: navigazione network-first, risorse locali offline. */
const CACHE_NAME = 'wallet-pro-v27-network-first-20261117';
const ASSETS = [
  './', './index.html', './manifest.json', './apple-touch-icon.png',
  './icon-192.png', './icon-512.png',
  './vendor/xlsx.full.min.js', './vendor/pdf.min.js', './vendor/pdf.worker.min.js',
  './vendor/tesseract.min.js', './vendor/worker.min.js',
  './vendor/tesseract-core.wasm.js', './vendor/tesseract-core.wasm',
  './vendor/lang/ita.traineddata.gz', './vendor/lang/eng.traineddata.gz'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(ASSETS.map(async path => {
      try {
        const req = new Request(path, {cache:'reload'});
        const response = await fetch(req);
        if (response.ok) await cache.put(req, response);
      } catch (_) { /* Una risorsa opzionale non deve bloccare l'installazione. */ }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('wallet-pro-') && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isNavigation = request.mode === 'navigate' || url.pathname.endsWith('/index.html');
  if (isNavigation) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(new Request(request, {cache:'no-store'}));
        if (response.ok && response.type === 'basic') {
          await cache.put(new Request('./index.html'), response.clone());
        }
        return response;
      } catch (_) {
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, {ignoreSearch:true});
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') event.waitUntil(cache.put(request,response.clone()));
    return response;
  })());
});
