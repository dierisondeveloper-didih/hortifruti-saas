// Service Worker — Hortifruti SaaS
// Suporta: PWA básico + recepção de Web Push (notificação com app fechado)
//
// PARA ATIVAR O PUSH REAL (passo futuro, junto com o Dierison):
// 1. Gerar par de chaves VAPID (web-push generate-vapid-keys)
// 2. Guardar VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY em env vars (Vercel)
// 3. No cliente: pedir permissão e registrar subscription (Notification + pushManager.subscribe)
// 4. Salvar a subscription no Supabase, associada ao dono_id
// 5. Disparar o push via cron-job.org -> endpoint serverless quando entra pedido
// Enquanto isso, a notificação sonora + toast (app aberto) já funciona via realtime.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Pass-through (necessário para o critério de PWA instalável)
  event.respondWith(fetch(event.request).catch(() => new Response('', { status: 408 })))
})

// Recebe o push do servidor e mostra a notificação (funciona com app fechado)
self.addEventListener('push', (event) => {
  let payload = { title: 'Novo pedido!', body: 'Você recebeu um novo pedido.' }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch (e) {
    // payload não-JSON, usa o default
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/logo-principal.png',
      badge: '/logo-principal.png',
      vibrate: [200, 100, 200],
      tag: 'novo-pedido',
      renotify: true,
      data: { url: payload.url || '/admin' },
    })
  )
})

// Ao clicar na notificação, abre/foca o painel admin
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    })
  )
})
