"use client"

import { useEffect, useRef } from "react"

/**
 * Integra um modal com o History API do navegador.
 * Quando o modal abre → pushState. Quando o usuário pressiona Voltar →
 * o modal fecha em vez de navegar. Quando fecha pelo X → history.back()
 * limpa a entrada empurrada.
 *
 * Suporta múltiplos modais simultâneos: cada um responde apenas ao
 * popstate que remove sua própria entrada (via e.state?.modal !== key).
 */
export function useModalHistory(isOpen: boolean, onClose: () => void, key: string) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const pushedRef = useRef(false)

  // Empurra entrada no histórico quando o modal abre
  useEffect(() => {
    if (isOpen && !pushedRef.current) {
      history.pushState({ modal: key }, "")
      pushedRef.current = true
    }
  }, [isOpen, key])

  // Intercepta botão Voltar do navegador
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Só age se este modal empurrou estado E o novo estado não é mais o nosso
      if (pushedRef.current && e.state?.modal !== key) {
        pushedRef.current = false
        onCloseRef.current()
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [key])

  // Quando fecha pelo X (não pelo Voltar), remove a entrada do histórico
  useEffect(() => {
    if (!isOpen && pushedRef.current) {
      pushedRef.current = false
      history.back()
    }
  }, [isOpen])
}
