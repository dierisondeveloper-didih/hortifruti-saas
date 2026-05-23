"use client"

import { useEffect, useRef, useCallback } from "react"
import { supabase } from "./supabase"
import { toast } from "sonner"

/**
 * Toca um "ding" agradável sintetizado via Web Audio API.
 * Não depende de arquivo de áudio hospedado — funciona offline e sem assets.
 */
function playChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // Duas notas em sequência (intervalo de quinta) — som de "caixa registradora" suave
    const notes = [
      { freq: 880, start: 0, dur: 0.18 },
      { freq: 1318.5, start: 0.12, dur: 0.28 },
    ]

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)

      const t0 = now + start
      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(0.25, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur)

      osc.start(t0)
      osc.stop(t0 + dur + 0.05)
    })

    setTimeout(() => ctx.close(), 1000)
  } catch {
    // Áudio bloqueado pelo navegador (sem interação do usuário ainda) — silencia
  }
}

interface UseOrderNotificationsOptions {
  enabled?: boolean
  soundEnabled?: boolean
  onNewOrder?: () => void
}

/**
 * Escuta novos pedidos do lojista logado em TEMPO REAL, em qualquer tela do admin.
 * Toca som + toast quando entra pedido novo. Atualiza o título da aba com contador.
 */
export function useOrderNotifications({
  enabled = true,
  soundEnabled = true,
  onNewOrder,
}: UseOrderNotificationsOptions = {}) {
  const userIdRef = useRef<string | null>(null)
  const unreadRef = useRef(0)
  const baseTitleRef = useRef<string>("")

  const updateTabTitle = useCallback(() => {
    if (typeof document === "undefined") return
    if (!baseTitleRef.current) {
      baseTitleRef.current = document.title.replace(/^\(\d+\)\s*/, "")
    }
    document.title =
      unreadRef.current > 0
        ? `(${unreadRef.current}) ${baseTitleRef.current}`
        : baseTitleRef.current
  }, [])

  const clearUnread = useCallback(() => {
    unreadRef.current = 0
    updateTabTitle()
  }, [updateTabTitle])

  useEffect(() => {
    if (!enabled) return

    let channel: ReturnType<typeof supabase.channel> | null = null
    let active = true

    async function setup() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !active) return
      userIdRef.current = user.id

      channel = supabase
        .channel("pedidos_admin_global")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "pedidos" },
          (payload) => {
            const novo = payload.new as { dono_id?: string; cliente_nome?: string; total?: number }
            if (novo.dono_id !== userIdRef.current) return

            unreadRef.current += 1
            updateTabTitle()

            if (soundEnabled) playChime()

            const totalFmt =
              typeof novo.total === "number"
                ? novo.total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                : ""

            toast.success("Novo pedido recebido!", {
              description: `${novo.cliente_nome ?? "Cliente"}${totalFmt ? ` — ${totalFmt}` : ""}`,
              duration: 12000,
            })

            onNewOrder?.()
          }
        )
        .subscribe()
    }

    setup()

    // Limpa o contador quando a aba volta ao foco
    const handleVisibility = () => {
      if (document.visibilityState === "visible") clearUnread()
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      active = false
      if (channel) supabase.removeChannel(channel)
      document.removeEventListener("visibilitychange", handleVisibility)
      unreadRef.current = 0
      if (baseTitleRef.current) document.title = baseTitleRef.current
    }
  }, [enabled, soundEnabled, onNewOrder, updateTabTitle, clearUnread])

  return { clearUnread }
}
