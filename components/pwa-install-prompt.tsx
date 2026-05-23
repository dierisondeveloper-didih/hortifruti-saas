"use client"

import { useState, useEffect } from "react"
import { PlusCircle, X, Share } from "lucide-react"
import { toast } from "sonner"

interface PwaInstallPromptProps {
  storeName: string
  primaryColor?: string
}

export function PwaInstallPrompt({ storeName, primaryColor }: PwaInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    setIsIos(isIosDevice)

    // Only show if not already installed
    if (isStandalone) return

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // For iOS, we can't detect if it's installable via event, but we can show the tip once
    if (isIosDevice && !isStandalone) {
      const hasSeenPrompt = localStorage.getItem("pwa_prompt_seen")
      if (!hasSeenPrompt) {
        setIsVisible(true)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setIsVisible(false)
      toast.success("Instalação iniciada!")
    }
  }

  const closePrompt = () => {
    setIsVisible(false)
    if (isIos) {
      localStorage.setItem("pwa_prompt_seen", "true")
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[90] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-2xl flex items-start gap-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: primaryColor ? `${primaryColor}20` : "rgba(45, 138, 78, 0.1)" }}
        >
          <PlusCircle className="w-6 h-6" style={{ color: primaryColor || "#2d8a4e" }} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-foreground truncate">
            Instalar {storeName}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isIos 
              ? "Toque em 'Compartilhar' e depois em 'Adicionar à Tela de Início'" 
              : "Adicione um atalho rápido à sua tela inicial."}
          </p>
          
          {isIos ? (
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-primary">
              <Share className="w-3.5 h-3.5" />
              <span>Instruções de instalação</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95"
              style={{ backgroundColor: primaryColor || "#2d8a4e" }}
            >
              Instalar Agora
            </button>
          )}
        </div>

        <button 
          onClick={closePrompt}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
