const CACHE_NAME = 'ssw-pm-mock-test-shell-v12';

const CORE = [
  './',
  './index.html',

  './styles.css?v=ssw12',
  './CSV-IMPORT-STYLES.css?v=ssw3',
  './RICH-HTML-STYLES.css?v=ssw3',
  './QUESTION-EDITOR-UPDATES.css?v=ssw12',

  './app.js?v=ssw12',
  './seed-data.js?v=ssw3',
  './db.js?v=ssw3',
  './utils.js?v=ssw3',
  './archive.js?v=ssw3',

  './manifest.webmanifest?v=ssw12',
  './hasbulla-192.png.png',
  './hasbulla-512.png.png',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(
      CORE.map(async path => {
        try {
          const url = new URL(path, self.registration.scope);
          const response = await fetch(url.href, {
            cache: 'reload'
          });

          if (response.ok) {
            await cache.put(url.href, response);
          }
        } catch (error) {
          console.warn('[SW] Gagal cache:', path, error);
        }
      })
    );

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith('ssw-pm-mock-test-shell-') &&
          key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (
    req.method !== 'GET' ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith((async () => {
    try {
      const networkResponse = await fetch(req);
      if (networkResponse && networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(req, networkResponse.clone());
        return networkResponse;
      }
    } catch (error) {
      // Offline fallback to cache below
    }

    const cached = await caches.match(req, { ignoreSearch: false }) || await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;

    if (req.mode === 'navigate') {
      return (
        await caches.match('./index.html')
      ) || new Response('Aplikasi sedang offline.', {
        status: 503,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    }

    return new Response('File tidak tersedia saat offline.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  })());
});
