// Saves a full copy of the app on the phone so it opens with no connection.
const CACHE = "meds-v1";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Offline first: answer from the saved copy, refresh it quietly when online.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      const network = fetch(event.request)
        .then((res) => {
          if (res && res.ok && new URL(event.request.url).origin === self.location.origin) {
            cache.put(event.request, res.clone());
          }
          return res;
        })
        .catch(() => null);
      if (cached) return cached;
      const res = await network;
      if (res) return res;
      if (event.request.mode === "navigate") return cache.match("./index.html");
      return new Response("", { status: 504 });
    })
  );
});
