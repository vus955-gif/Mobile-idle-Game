// Service worker: gra działa offline z jednej, spójnej wersji plików (nazwa CACHE).
// CACHE to skrót treści plików z ASSETS. Nie edytuj go ręcznie: po zmianie plików gry uruchom
// `npm run sw:version` (tests/sw.test.mjs pada, gdy nazwa jest nieaktualna).
const CACHE = 'krzemowe-imperium-57637ac1a6f0';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/config.js',
  './js/engine.js',
  './js/data.js',
  './js/space.js',
  './js/galaxy.js',
  './js/universe.js',
  './js/layers.js',
  './js/format.js',
  './js/i18n.js',
  './js/text.js',
  './js/lang/en.js',
  './js/ui.js',
  './js/scene.js',
  './js/audio.js',
  './js/music.js',
  './js/worldmap.js',
  './js/avatar.js',
  './js/art/noise.js',
  './js/art/canvas.js',
  './js/art/backdrop.js',
  './js/art/worker.js',
  './js/art/kit/sky.js',
  './js/art/kit/bodies.js',
  './js/art/kit/surface.js',
  './js/art/kit/earth.js',
  './js/art/views/index.js',
  './js/art/views/placeholder.js',
  './js/art/views/common.js',
  './js/art/views/earth.js',
  './js/art/views/space.js',
  './js/art/views/galaxy.js',
  './js/art/views/universe.js',
  './js/diorama/iso.js',
  './js/diorama/parts.js',
  './js/diorama/island.js',
  './js/diorama/frame.js',
  './js/diorama/layout.js',
  './js/diorama/index.js',
  './js/diorama/skyline.js',
  './js/diorama/earth.js',
  './js/diorama/space.js',
  './js/diorama/galaxy.js',
  './js/diorama/universe.js',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-32.png',
];

// Komplet plików prosto z sieci: `cache: 'reload'` omija pamięć HTTP przeglądarki, która mogłaby
// podsunąć starą kopię modułu do nowej wersji cache.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

// Nowa wersja przejmuje otwarte strony od razu (skipWaiting + claim), a js/main.js przeładowuje wtedy
// stronę raz, żeby cała gra działała na nowym kodzie. Stare wersje cache znikają dopiero tutaj.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Pliki gry tylko z cache bieżącej wersji. Nic nie odświeża ich pojedynczo w tle: dawniej pierwsze
// uruchomienie po wdrożeniu szło na starym kodzie, a następne mogło złożyć nowy moduł ze starym.
// Nowa wersja przychodzi w całości przez nowy sw.js (inna nazwa CACHE). Spoza ASSETS — prosto z sieci.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE)
      .then((cache) => cache.match(req, { ignoreSearch: true }))
      .then((cached) => cached || fetch(req)),
  );
});
