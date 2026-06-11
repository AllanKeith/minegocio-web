// ══════════════════════════════════════
// MINEGOCIO — Service Worker v2
// Funciona 100% sin internet
// ══════════════════════════════════════

var CACHE_NOMBRE = 'minegocio-v2';

var ARCHIVOS_CACHE = [
  './minegocio.html',
  './index.html',
  './minegocio.css',
  './minegocio.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: guarda todos los archivos en caché
self.addEventListener('install', function(evento) {
  evento.waitUntil(
    caches.open(CACHE_NOMBRE).then(function(cache) {
      return Promise.allSettled(
        ARCHIVOS_CACHE.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.log('No se pudo cachear: ' + url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Activación: limpia cachés viejas
self.addEventListener('activate', function(evento) {
  evento.waitUntil(
    caches.keys().then(function(claves) {
      return Promise.all(
        claves.filter(function(clave) { return clave !== CACHE_NOMBRE; })
              .map(function(clave) { return caches.delete(clave); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: sirve desde caché primero, si no hay va a la red
self.addEventListener('fetch', function(evento) {
  evento.respondWith(
    caches.match(evento.request).then(function(respuesta) {
      if (respuesta) {
        return respuesta;
      }
      return fetch(evento.request).then(function(respuestaRed) {
        // Guarda en caché cualquier recurso nuevo que se descargue
        if (respuestaRed && respuestaRed.status === 200) {
          var respuestaClon = respuestaRed.clone();
          caches.open(CACHE_NOMBRE).then(function(cache) {
            cache.put(evento.request, respuestaClon);
          });
        }
        return respuestaRed;
      }).catch(function() {
        // Sin internet y sin caché: devuelve la página principal
        return caches.match('./minegocio.html');
      });
    })
  );
});
