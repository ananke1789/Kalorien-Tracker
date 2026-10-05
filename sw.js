// Service Worker: App-Dateien offline aus dem Cache liefern.
// Bei jeder Änderung an ausgelieferten Dateien CACHE_VERSION erhöhen!
const CACHE_VERSION = 'v9';
const CACHE = 'tagesplan-' + CACHE_VERSION;
const FILES = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'js/app.js',
  'js/core.js',
  'js/db.js',
  'js/util.js',
  'js/charts.js',
  'js/views/today.js',
  'js/views/foods.js',
  'js/views/stats.js',
  'js/views/goals.js',
  'js/views/backup.js',
  'js/views/training.js',
  'js/views/workout.js',
  'js/views/thistory.js',
  'js/views/tstats.js',
  'js/training/catalog.js',
  'js/training/plans.js',
  'js/training/model.js',
  'js/training/store.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-192.png',
  'icons/maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tagesplan-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache zuerst, sonst Netz; Navigationen fallen offline auf index.html zurück
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('index.html') : Response.error()));
    }),
  );
});
