// =============================================
// SERVICE WORKER - v2 (Update notification)
// Every time you make changes, increase the version number!
// v1 → v2 → v3 etc.
// =============================================

const CACHE_NAME = 'nammade-bus-v2'; // ← Change this every update!

const ASSETS = [
  '/Nammade-bus/',
  '/Nammade-bus/index.html',
  '/Nammade-bus/tothodupuzha.html',
  '/Nammade-bus/fromthodupuzha.html',
  '/Nammade-bus/manifest.json',
  '/Nammade-bus/firebase-config.js',
  '/Nammade-bus/bus-overrides.js',
  '/Nammade-bus/icon-192.png',
  '/Nammade-bus/icon-512.png',
  '/Nammade-bus/theme-light.png',
  '/Nammade-bus/theme-dark.png',
  '/Nammade-bus/share.png',
  '/Nammade-bus/donation.png'
];

// Install — cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).catch(err => console.log('Cache install error:', err))
  );
  // Immediately take over — don't wait for old SW to die
  self.skipWaiting();
});

// Activate — delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    })
  );
  // Take control of all open pages immediately
  self.clients.claim();
  
  // Tell all open pages to show update notification
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'APP_UPDATED' });
    });
  });
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Save fresh copy to cache
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback for HTML pages
          if (event.request.destination === 'document') {
            return caches.match('/Nammade-bus/index.html');
          }
        });
      })
  );
});
