// Service Worker versioned cache cleanup script
// Deletes any outdated app caches during the activate event while preserving
// current version caches and immutable font/Quran caches.
self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING' && typeof self.skipWaiting === 'function') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  const currentVersion = self.__RIHLAT_APP_VERSION__ || '';
  const expectedPrefix = currentVersion ? `rihlat-alnoor-v${currentVersion}` : '';
  const staticPreservedCaches = new Set([
    'google-fonts-cache',
    'gstatic-fonts-cache',
    'quran-surahs-api-cache',
  ]);

  event.waitUntil(
    (async () => {
      if (typeof caches === 'undefined') return;
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (staticPreservedCaches.has(key)) return Promise.resolve(false);
          if (expectedPrefix && key.startsWith(expectedPrefix)) {
            return Promise.resolve(false);
          }
          if (key.includes('workbox-precache') && expectedPrefix && key.includes(expectedPrefix)) {
            return Promise.resolve(false);
          }
          return caches.delete(key);
        })
      );
      if (self.clients && typeof self.clients.claim === 'function') {
        await self.clients.claim();
      }
    })()
  );
});
