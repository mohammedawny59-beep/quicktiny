// Bump VERSION when the CORE list changes; old caches are deleted on activate.
const VERSION = "v3";
const CORE_CACHE = "quicktiny-core-" + VERSION;
const RUNTIME_CACHE = "quicktiny-runtime-" + VERSION;
const RUNTIME_MAX_ENTRIES = 60;
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
  "/compress-image",
  "/ar",
  "/ar/prayer-times",
  "/prayer-cities.js",
  "/prayer-times.js",
  "/hijri.js",
  "/ar/gpa-calculator",
  "/gpa-calculator",
  "/ar/weighted-percentage-calculator",
  "/student.js",
  "/ar/zakat-al-fitr-calculator",
  "/ar/ramadan-countdown",
  "/ramadan.js",
  "/compress-image.js",
  "/home.js"
];
// Large media is never worth caching offline.
const SKIP_EXT = /\.(mp4|webm|mov|png|jpe?g|gif|webp|avif|csv|zip)$/i;

self.addEventListener("install", function(event) {
  event.waitUntil(caches.open(CORE_CACHE).then(function(cache) {
    return cache.addAll(CORE);
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(event) {
  var keep = [CORE_CACHE, RUNTIME_CACHE];
  event.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(key){ return keep.indexOf(key) === -1; }).map(function(key){ return caches.delete(key); }));
  }).then(function(){ return self.clients.claim(); }));
});

// Keep the runtime cache bounded: drop the oldest entries beyond the limit.
function trimCache(name, max) {
  return caches.open(name).then(function(cache) {
    return cache.keys().then(function(keys) {
      if (keys.length <= max) return;
      return Promise.all(keys.slice(0, keys.length - max).map(function(k){ return cache.delete(k); }));
    });
  });
}

function isCorePath(pathname) {
  return CORE.indexOf(pathname) !== -1;
}

self.addEventListener("fetch", function(event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url = new URL(request.url);
  if (url.origin !== location.origin || url.pathname.indexOf("/api/") === 0 || url.pathname.indexOf("/_vercel/") === 0) return;
  if (SKIP_EXT.test(url.pathname)) return;

  var isPage = request.mode === "navigate";
  // Ignore query strings (utm_* etc.) so one page isn't cached many times.
  var cacheKey = isPage ? new Request(url.origin + url.pathname) : request;

  // Network first, so deploys show up immediately; cache is only the offline fallback.
  event.respondWith(fetch(request).then(function(response) {
    if (response && response.ok && response.type === "basic") {
      var copy = response.clone();
      var target = isCorePath(url.pathname) ? CORE_CACHE : RUNTIME_CACHE;
      event.waitUntil(caches.open(target).then(function(cache){
        return cache.put(cacheKey, copy);
      }).then(function(){
        if (target === RUNTIME_CACHE) return trimCache(RUNTIME_CACHE, RUNTIME_MAX_ENTRIES);
      }));
    }
    return response;
  }).catch(function() {
    return caches.match(cacheKey).then(function(cached){
      if (cached) return cached;
      // Only pages fall back to the homepage; a missing script or image should just fail.
      if (isPage) return caches.match("/");
      return Response.error();
    });
  }));
});
