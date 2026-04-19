// ── SERVICE WORKER — Sylvastere ────────────────────────
const CACHE_NAME = "sylvastere-v1";

const ASSETS = [
  "/",
  "/index.html",
  "/assets/style.css",
  "/assets/app.js",
  "/assets/gps.js",
  "/assets/pdf.js",
  "/assets/manifest.json",
  "/assets/img/icon.png",
  "/assets/img/icon_app.png",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js",
];

// Installation — mise en cache de tous les assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// Activation — nettoyage des vieux caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch — cache first, network fallback
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request)),
  );
});
