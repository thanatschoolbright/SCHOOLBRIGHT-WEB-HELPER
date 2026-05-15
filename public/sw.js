const CACHE_NAME = "sb-web-helper-v2"; // อัปเดต Version เมื่อมีการเปลี่ยน Logic หลัก

// --- Helper Functions ---
const logError = (message, error) => {
  console.error(`[SW Error]: ${message}`, error);
};

// --- Events ---

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName).catch((err) => {
              logError(`Failed to delete cache: ${cacheName}`, err);
            });
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ✅ Filtering: ข้ามสิ่งที่ไม่ต้องการ Cache
  if (
    request.method !== "GET" ||
    url.protocol.startsWith("chrome-extension") ||
    url.protocol.includes("ws") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // ✅ Strategy: Network-First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // จัดเก็บเฉพาะความสำเร็จ (Status 200 OK)
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(async (error) => {
        // ✅ เมื่อ Network พัง (Offline) ให้พยายามดึงจาก Cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // กรณีไม่มีทั้ง Network และ Cache
        logError(`Network failed and no cache available for: ${url.pathname}`, error);

        return new Response("Offline - Resource not available", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      })
  );
});
