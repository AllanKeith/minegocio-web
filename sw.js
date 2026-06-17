// ══════════════════════════════════════════════
// MINEGOCIO — Service Worker
// Guarda los archivos de la app en el dispositivo para
// que funcione aunque no haya conexión a internet.
// ══════════════════════════════════════════════

// Sube este número cada vez que subas una nueva versión de la app
// para que los teléfonos descarguen los archivos actualizados.
var CACHE_NAME = 'minegocio-cache-v1';

var ARCHIVOS_APP = [
  './',
  './index.html',
  './minegocio.css',
  './minegocio.js',
  './jspdf.umd.min.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Guardar todos los archivos de la app al instalar el service worker.
// Se guarda cada archivo por separado (en vez de todo o nada) para que,
// si uno falla, el resto de la app siga funcionando sin internet.
self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(
        ARCHIVOS_APP.map(function (url) {
          return cache.add(url).catch(function (err) {
            console.warn('No se pudo guardar en caché:', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Borrar cachés de versiones anteriores cuando se activa una nueva versión
self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nombres) {
      return Promise.all(
        nombres
          .filter(function (nombre) { return nombre !== CACHE_NAME; })
          .map(function (nombre) { return caches.delete(nombre); })
      );
    })
  );
  self.clients.claim();
});

// Responder primero desde la copia guardada en el dispositivo (rápido y
// funciona sin internet); si no está guardada, intentar buscarla en la red
// y guardar una copia para la próxima vez.
self.addEventListener('fetch', function (evento) {
  if (evento.request.method !== 'GET') return;

  evento.respondWith(
    caches.match(evento.request).then(function (respuestaGuardada) {
      if (respuestaGuardada) return respuestaGuardada;

      return fetch(evento.request)
        .then(function (respuestaRed) {
          if (respuestaRed && respuestaRed.status === 200) {
            var copia = respuestaRed.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(evento.request, copia);
            });
          }
          return respuestaRed;
        })
        .catch(function () {
          // Sin internet y sin copia guardada: si es la pantalla principal,
          // mostrar igual el index.html guardado en vez de un error.
          if (evento.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
