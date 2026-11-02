const CACHE_NAME = 'ssw-pm-mock-test-shell-v3';
const CORE = [
  './',
  './index.html',
  './styles.css?v=ssw3',
  './CSV-IMPORT-STYLES.css?v=ssw3',
  './RICH-HTML-STYLES.css?v=ssw3',
  './QUESTION-EDITOR-UPDATES.css?v=ssw3',
  './js/app.js?v=ssw3',
  './js/seed-data.js?v=ssw3',
  './js/db.js?v=ssw3',
  './js/utils.js?v=ssw3',
  './js/archive.js?v=ssw3',
  './manifest.webmanifest?v=ssw3',
  './assets/icon.svg',
  './data/ssw-pm-kunci-ujian-1.json',
  './data/ssw-pm-tipe2-nguyen1.json',
  './data/questions.json',
  './assets/questions/ssw-pm-kunci-ujian-1-q033.png',
  './assets/questions/ssw-pm-kunci-ujian-1-q034.png',
  './assets/questions/ssw-pm-kunci-ujian-1-q037.png',
  './assets/questions/ssw-pm-kunci-ujian-1-q038.png',
  './assets/questions/ssw-pm-kunci-ujian-1-q039.png',
  './assets/questions/ssw-pm-kunci-ujian-1-q040.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const isLocal = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
  if (isLocal) {
    event.respondWith(fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req)));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
    }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
