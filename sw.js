// Offline support: the app shell is cached on first visit, so the tracker works without network.
const CACHE = "initable-v10";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// network first for the page itself (so updates arrive), cache first for everything else (fonts, icons)
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  // only the app files, fonts and script libraries are cached; Firebase traffic always goes to the network
  const u = new URL(r.url);
  if (u.origin !== location.origin && !/^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|www\.gstatic\.com)$/.test(u.hostname)) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put("./index.html", c)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if (res.ok || res.type === "opaque") { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); }
    return res;
  })));
});
