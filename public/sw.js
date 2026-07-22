const CACHE_NAME = "clinic-os-cache-v1"
const STATIC_ASSETS = [
  "/",
  "/home",
  "/horizontal-logo.png",
  "/square-logo.png",
  "/manifest.json"
]

// Install event - precache static app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// Network-First with Cache Fallback for dynamic pages
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return

  // Skip browser extension requests
  if (!event.request.url.startsWith("http")) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and update cache if valid GET response
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Offline fallback from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          if (event.request.mode === "navigate") {
            return caches.match("/")
          }
          return new Response("Offline", { status: 503, statusText: "Offline" })
        })
      })
  )
})
