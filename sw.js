
const CACHE_NAME = 'ssw-pm-mock-test-shell-v4';

const CORE = [
  './',
  './index.html',

  './styles.css?v=ssw4',
  './CSV-IMPORT-STYLES.css?v=ssw3',
  './RICH-HTML-STYLES.css?v=ssw3',
  './QUESTION-EDITOR-UPDATES.css?v=ssw3',

  './app.js?v=ssw5',
  './seed-data.js?v=ssw3',
  './db.js?v=ssw3',
  './utils.js?v=ssw3',
  './archive.js?v=ssw3',

  './manifest.webmanifest?v=ssw4',
  './icon.svg'
];

// Install: file yang gagal ditemukan tidak akan
// menggagalkan seluruh proses instalasi cache.
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
          } else {
            console.warn(
              '[SW] File dilewati:',
              path,
              response.status
            );
          }
        } catch (error) {
          console.warn('[SW] Gagal cache:', path, error);
        }
      })
    );

    await self.skipWaiting();
  })());
});

// Activate: hapus cache versi lama milik aplikasi ini saja.
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

// Fetch: cache-first, lalu ambil dari jaringan.
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
    const cached = await caches.match(req);

    if (cached) return cached;

    try {
      const response = await fetch(req);

      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(req, response.clone());
      }

      return response;
    } catch (error) {
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
    }
  })());
});
