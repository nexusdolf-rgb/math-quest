/* Math Quest — Service Worker (hors-ligne) */
const VERSION = 'math-quest-v5-';
const FICHIERS = [
  './',
  './index.html',
  './css/styles.css',
  './css/print.css',
  './js/util.js',
  './js/audio.js',
  './js/fx.js',
  './js/data.js',
  './js/profile.js',
  './js/questions.js',
  './js/engine-quiz.js',
  './js/games.js',
  './js/aventure.js',
  './js/screens.js',
  './js/app.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION + '1').then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cles =>
      Promise.all(cles.filter(c => !c.startsWith(VERSION)).map(c => caches.delete(c)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then(trouve =>
      trouve || fetch(e.request).then(reponse => {
        const copie = reponse.clone();
        caches.open(VERSION + '1').then(c => c.put(e.request, copie)).catch(() => {});
        return reponse;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
