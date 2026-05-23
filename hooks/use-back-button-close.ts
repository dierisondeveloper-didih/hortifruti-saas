"use client"

import { useEffect, useRef } from "react"

export function useBackButtonClose(isOpen: boolean, onClose: () => void) {
  const isClosingFromPopState = useRef(false)

  useEffect(() => {
    if (!isOpen) return

    isClosingFromPopState.current = false
    // Push a state so that pressing back pops it instead of navigating away
    window.history.pushState({ modalOpen: true }, "")

    const handlePopState = () => {
      isClosingFromPopState.current = true
      onClose()
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
      // If the modal was closed via X/Escape (not popstate), we need to manually pop the state
      // to keep the history clean.
      if (!isClosingFromPopState.current && window.history.state?.modalOpen) {
        window.history.back()
      }
    }
  }, [isOpen, onClose])
}
