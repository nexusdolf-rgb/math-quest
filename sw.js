/* Math Quest — Service Worker (hors-ligne) */
const VERSION = 'math-quest-v9-';
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
  './js/multi.js',
  './js/plus.js',
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
  // Ne pas intercepter les scripts injectés par la plateforme d'hébergement
  // (badge Netlify…) : ils doivent simplement échouer proprement hors-ligne.
  if (e.request.url.includes('/.netlify/')) return;
  e.respondWith(
    caches.match(e.request).then(trouve => {
      if (trouve) return trouve;
      return fetch(e.request).then(reponse => {
        // Ne mettre en cache que les vraies réponses succès : on évite ainsi
        // qu'une page d'erreur HTML soit servie plus tard comme un .js.
        if (reponse.ok && (reponse.type === 'basic' || reponse.type === 'cors')) {
          const copie = reponse.clone();
          caches.open(VERSION + '1').then(c => c.put(e.request, copie)).catch(() => {});
        }
        return reponse;
      }).catch(() => {
        // Hors-ligne et absent du cache : index.html pour les navigations,
        // un échec propre et silencieux pour tout le reste (scripts, images…).
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
