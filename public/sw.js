// ============================================================
// Service Worker — Hortifruti SaaS
// Suporta PWA (instalável) + recepção de Web Push.
//
// NÃO intercepta fetch: o handler de fetch anterior devolvia 408
// quando alguma requisição falhava (comum em dev/HMR), poluindo o
// console sem trazer benefício. PWA instalável não exige fetch handler.
//
// PARA ATIVAR O PUSH REAL (passo futuro):
// 1. Gerar par VAPID (web-push generate-vapid-keys)
// 2. Guardar chaves em env vars (Vercel)
// 3. No cliente: pedir permissão + registrar subscription
// 4. Salvar subscription no Supabase, associada ao dono_id
// 5. Disparar push via cron quando entra pedido
// ============================================================

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Recebe push do servidor e mostra a notificação (funciona com app fechado)
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
