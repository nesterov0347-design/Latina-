// Версию меняй при каждом обновлении приложения, чтобы у всех подтянулась новая.
const VERSION = "latina-v1";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // Сначала кэш (быстро и без интернета), в фоне обновляем копию.
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cached) => {
      const fresh = fetch(e.request).then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => cached);
      return cached || fresh.then((r) => r || caches.match("./index.html"));
    })
  );
});
