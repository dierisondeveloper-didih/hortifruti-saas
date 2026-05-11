"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.error("Erro ao registrar o Service Worker:", err)
        })
      })
    }
  }, [])

  return null
}