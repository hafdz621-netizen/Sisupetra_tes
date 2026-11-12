// SisuPetra service worker: app shell offline + cache ubin peta yang pernah dilihat
const APP = 'sisupetra-app-v2', TILES = 'sisupetra-tiles-v1', MAX_TILES = 4000
self.addEventListener('install', (e) => { e.waitUntil(caches.open(APP).then((c) => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']))); self.skipWaiting() })
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => ![APP, TILES].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim())) })
self.addEventListener('fetch', (e) => {
  const req = e.request, u = new URL(req.url)
  if (req.method !== 'GET') return
  if (u.origin === location.origin) { // app: jaringan dulu supaya update cepat, cache bila offline
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(APP).then((x) => x.put(req, c)); return r }).catch(() => caches.match(req).then((r) => r || caches.match('index.html'))))
    return
  }
  if (/\.(png|jpg|jpeg|webp)(\?|$)/i.test(u.pathname) || /\/tile\/|\{?z\}?\/|\/MapServer\/tile/.test(u.pathname)) { // ubin: cache dulu, perbarui di belakang
    e.respondWith(caches.open(TILES).then(async (c) => {
      const hit = await c.match(req)
      const net = fetch(req).then(async (r) => { if (r.ok || r.type === 'opaque') { await c.put(req, r.clone()); const ks = await c.keys(); if (ks.length > MAX_TILES) for (const k of ks.slice(0, 500)) c.delete(k) } return r }).catch(() => hit)
      return hit || net
    }))
  }
})
