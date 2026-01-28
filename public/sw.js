const CACHE_NAME = "sb-web-helper-v1";

self.addEventListener("install", (event) => {
  console.log("[SW] Service worker installed.");
  self.skipWaiting(); // Activate worker immediately
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Service worker activated.");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Clearing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ✅ Skip non-GET requests (POST, PUT, DELETE)
  if (request.method !== "GET") {
    return;
  }

  // ✅ Skip Chrome Extension requests
  if (url.protocol === "chrome-extension:") {
    return;
  }

  // ✅ Skip WebSocket connections
  if (url.protocol === "ws:" || url.protocol === "wss:") {
    return;
  }

  // ✅ Skip API calls (ให้ไปถึง Server จริงเสมอ)
  if (url.pathname.startsWith("/api/")) {
    return fetch(request).catch(() => {
      console.warn("[SW] API fetch failed:", url.pathname);
    });
  }

  // ✅ Network-First Strategy (สำหรับ Static Assets)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone response เพื่อ cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // ✅ Fallback to cache ถ้า Network fail
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("[SW] Serving from cache:", url.pathname);
            return cachedResponse;
          }
          // ✅ Return offline page หรือ error response
          console.warn("[SW] No cache available for:", url.pathname);
          return new Response("Offline - Resource not available", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      }),
  );
});
