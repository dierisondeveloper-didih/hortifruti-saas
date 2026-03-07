"use client"

import { useEffect, useRef, useCallback } from "react"
import { X } from "lucide-react"

interface FullScreenVideoPlayerProps {
  videoUrl: string
  productName: string
  isOpen: boolean
  onClose: () => void
}

export function FullScreenVideoPlayer({
  videoUrl,
  productName,
  isOpen,
  onClose,
}: FullScreenVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"

      // Try to play with sound (browsers may block this)
      if (videoRef.current) {
        videoRef.current.muted = false
        videoRef.current.play().catch(() => {
          // If autoplay with sound fails, try muted
          if (videoRef.current) {
            videoRef.current.muted = true
            videoRef.current.play()
          }
        })
      }
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleKeyDown])

  // Click outside video to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Video do produto ${productName}`}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors"
        aria-label="Fechar video"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Product name badge */}
      <div className="absolute top-4 left-4 z-10 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md">
        <span className="text-white text-sm font-medium">{productName}</span>
      </div>

      {/* Video container - vertical aspect ratio like TikTok/Stories */}
      <div className="relative w-full max-w-md h-full max-h-[90vh] flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          loop
          playsInline
          controls
          className="w-full h-full max-h-[85vh] object-contain rounded-2xl"
          style={{ maxWidth: "100%", aspectRatio: "9/16" }}
        />
      </div>

      {/* Swipe hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md">
        <span className="text-white/70 text-xs">
          Toque fora ou pressione ESC para fechar
        </span>
      </div>
    </div>
  )
}
