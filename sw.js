const CACHE_NAME = 'nammade-bus-v1';

const ASSETS = [
  '/Nammade-bus/',
  '/Nammade-bus/index.html',
  '/Nammade-bus/tothodupuzha.html',
  '/Nammade-bus/fromthodupuzha.html',
  '/Nammade-bus/manifest.json',
  '/Nammade-bus/icon-192.png',
  '/Nammade-bus/icon-512.png',
  '/Nammade-bus/theme-light.png',
  '/Nammade-bus/theme-dark.png',
  '/Nammade-bus/share.png',
  '/Nammade-bus/donation.png',
  '/Nammade-bus/GPAYQR.png'
];

// Install — cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS.filter(url => !url.includes('GPAYQR')));
    })
  );
  self.skipWaiting();
});

// Activate — delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => {
        // Offline fallback for HTML pages
        if (event.request.destination === 'document') {
          return caches.match('/Nammade-bus/index.html');
        }
      });
    })
  );
});
