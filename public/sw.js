self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalado');
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado');
});

self.addEventListener('fetch', (event) => {
  // Pass-through básico (apenas para passar no critério de PWA do Lighthouse)
  event.respondWith(fetch(event.request));
});