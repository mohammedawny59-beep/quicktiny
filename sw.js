const CACHE = "quicktiny-v1";
const CORE = [
  "/",
  "/styles.css",
  "/site.js",
  "/quicktiny-app-icon.svg",
  "/json-formatter",
  "/base64-encode-decode",
  "/url-encode-decode",
  "/timestamp-converter",
  "/word-counter",
  "/clean-text",
  "/remove-duplicate-lines",
  "/sort-lines",
  "/case-converter",
  "/seo-slug-generator",
  "/password-generator",
  "/compress-image"
];

self.addEventListener("install", function(event) {
  event.waitUntil(caches.open(CACHE).then(function(cache) {
    return cache.addAll(CORE);
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(event) {
  event.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(key){ return key !== CACHE; }).map(function(key){ return caches.delete(key); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url = new URL(request.url);
  if (url.origin !== location.origin || url.pathname.indexOf("/api/") === 0 || url.pathname.indexOf("/_vercel/") === 0) return;

  event.respondWith(fetch(request).then(function(response) {
    if (response && response.ok) {
      var copy = response.clone();
      caches.open(CACHE).then(function(cache){ cache.put(request, copy); });
    }
    return response;
  }).catch(function() {
    return caches.match(request).then(function(cached){ return cached || caches.match("/"); });
  }));
});
