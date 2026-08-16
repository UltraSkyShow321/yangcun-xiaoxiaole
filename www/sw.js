/* 羊村消消乐 - Service Worker:网络优先,缓存兜底(离线可玩且永远最新) */
const CACHE = 'yxxl-v3';
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/audio.js',
  './js/assets.js',
  './js/store.js',
  './js/levels.js',
  './js/board.js',
  './js/game.js',
  './js/ui.js',
  './js/main.js',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      const copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) {
        return hit || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined);
      });
    })
  );
});
