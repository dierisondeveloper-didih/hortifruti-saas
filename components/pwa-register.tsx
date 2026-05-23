"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    // Registra diretamente no useEffect (já é pós-hidratação).
    // Não usa window.addEventListener("load") porque se a página chegar
    // do cache/prefetch o evento load já disparou — o callback nunca rodaria
    // e o SW ficaria sem registrar, fazendo o Chrome abrir em modo browser.
    const register = () =>
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Erro ao registrar o Service Worker:", err)
      })

    if (document.readyState === "complete") {
      register()
    } else {
      window.addEventListener("load", register, { once: true })
    }
  }, [])

  return null
}
