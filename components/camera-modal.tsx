"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { X, SwitchCamera, Zap, Loader2, Upload } from "lucide-react"
import type { AdminProduct } from "@/components/admin-product-list"

const MAX_RECORDING_SECONDS = 15

interface CameraModalProps {
  product: AdminProduct | null
  isOpen: boolean
  onClose: () => void
  onSave?: (productId: string, videoBlob: Blob) => void
}

export function CameraModal({ product, isOpen, onClose, onSave }: CameraModalProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [isStopping, setIsStopping] = useState(false)
  const [supportsZoom, setSupportsZoom] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [zoomMin, setZoomMin] = useState(1)
  const [zoomMax, setZoomMax] = useState(5)
  const [zoomStep, setZoomStep] = useState(0.1)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const zoomTrackRef = useRef<MediaStreamTrack | null>(null)

  // Start camera when modal opens
  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    async function startCamera() {
      setCameraReady(false)
      setCameraError(null)

      // Stop any previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 720 }, height: { ideal: 1280 } },
          audio: true,
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream

        // Detect zoom support
        const track = stream.getVideoTracks()[0]
        zoomTrackRef.current = track
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const capabilities = track.getCapabilities() as any
        if (capabilities && "zoom" in capabilities) {
          const zCap = capabilities.zoom
          setSupportsZoom(true)
          setZoomMin(zCap.min ?? 1)
          setZoomMax(zCap.max ?? 5)
          setZoomStep(zCap.step ?? 0.1)
          setZoomLevel(zCap.min ?? 1)
        } else {
          setSupportsZoom(false)
          setZoomLevel(1)
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        setCameraReady(true)
      } catch (err) {
        if (!cancelled) {
          setCameraError(
            err instanceof Error
              ? err.message
              : "Nao foi possivel acessar a camera"
          )
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
    }
  }, [isOpen, facingMode])

  // Clean up on close
  useEffect(() => {
    if (!isOpen) {
      // Stop stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      // Stop recorder
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop()
      }
      recorderRef.current = null
      chunksRef.current = []
      // Reset state
      setIsRecording(false)
      setRecordingTime(0)
      setCameraReady(false)
      setCameraError(null)
      setIsStopping(false)
      setSupportsZoom(false)
      setZoomLevel(1)
      zoomTrackRef.current = null
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isOpen])

  // Recording timer with auto-stop at MAX_RECORDING_SECONDS
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            // Auto-stop
            stopRecording()
            return MAX_RECORDING_SECONDS
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      setIsStopping(true)
      recorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    chunksRef.current = []
    setRecordingTime(0)

    // Choose supported mime type
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4"

    const recorder = new MediaRecorder(streamRef.current, { mimeType })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      chunksRef.current = []

      if (blob.size > 0 && product && onSave) {
        onSave(product.id, blob)
      } else {
        setIsStopping(false)
      }
    }

    recorderRef.current = recorder
    recorder.start(250) // collect data every 250ms
    setIsRecording(true)
  }, [product, onSave])

  const handleRecordToggle = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, stopRecording, startRecording])

  const handleSwitchCamera = useCallback(() => {
    if (isRecording) return
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
  }, [isRecording])

  const handleZoomChange = useCallback(async (value: number) => {
    setZoomLevel(value)
    if (zoomTrackRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await zoomTrackRef.current.applyConstraints({ advanced: [{ zoom: value } as any] })
      } catch {
        // Zoom not applicable, ignore
      }
    }
  }, [])

  const handleClose = useCallback(() => {
    if (isRecording) {
      // Discard recording
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.onstop = null // prevent onSave
        recorderRef.current.stop()
      }
      setIsRecording(false)
    }
    onClose()
  }, [isRecording, onClose])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  if (!isOpen || !product) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Gravar video de ${product.name}`}
    >
      {/* Camera viewfinder - REAL camera feed */}
      <div className="relative flex-1 bg-neutral-950 flex flex-col overflow-hidden">
        {/* Live video preview */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Fallback dark background if camera not ready */}
        {!cameraReady && (
          <div className="absolute inset-0 bg-neutral-950 flex items-center justify-center">
            {cameraError ? (
              <div className="flex flex-col items-center gap-3 px-8 text-center">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-6 h-6 text-white/60" />
                </div>
                <p className="text-white/80 text-sm font-medium">
                  Camera indisponivel
                </p>
                <p className="text-white/40 text-xs max-w-xs">
                  {cameraError}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
                <p className="text-white/60 text-sm">Abrindo camera...</p>
              </div>
            )}
          </div>
        )}

        {/* Uploading overlay */}
        {isStopping && (
          <div className="absolute inset-0 z-30 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-white animate-pulse" />
            </div>
            <p className="text-white font-medium text-sm">
              Preparando video...
            </p>
          </div>
        )}

        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/40 via-transparent to-neutral-950/30 pointer-events-none z-10" />

        {/* Top controls */}
        <div className="relative z-20 flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white transition-colors hover:bg-black/50 active:scale-95"
            aria-label="Fechar camera"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              <span className="text-white text-sm font-bold tracking-wide font-mono">
                {formatTime(recordingTime)}
              </span>
            </div>
          )}

          <div className="w-10" />
        </div>

        {/* Recording progress bar */}
        {isRecording && (
          <div className="relative z-20 mx-4 h-1 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(recordingTime / MAX_RECORDING_SECONDS) * 100}%` }}
            />
          </div>
        )}

        {/* Center - product label */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center gap-4 pointer-events-none">
          {/* Viewfinder corners */}
          <div className="relative w-56 h-56 flex items-center justify-center">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/40 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/40 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/40 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/40 rounded-br-lg" />

            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-white/60 text-sm">
                {isRecording ? "Gravando..." : cameraReady ? "Aponte para o produto" : ""}
              </span>
              <span className="text-white text-lg font-bold drop-shadow-lg">
                {product.name}
              </span>
            </div>
          </div>
        </div>

        {/* Zoom slider */}
        {supportsZoom && cameraReady && (
          <div className="relative z-20 px-6 pb-2">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/50 backdrop-blur-md">
              <button
                onClick={() => handleZoomChange(Math.max(zoomMin, parseFloat((zoomLevel - zoomStep).toFixed(2))))}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-lg font-bold shrink-0 hover:bg-white/30 active:scale-95 transition-all"
                aria-label="Diminuir zoom"
              >
                −
              </button>
              <input
                type="range"
                min={zoomMin}
                max={zoomMax}
                step={zoomStep}
                value={zoomLevel}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 accent-white cursor-pointer"
                aria-label="Nível de zoom"
              />
              <button
                onClick={() => handleZoomChange(Math.min(zoomMax, parseFloat((zoomLevel + zoomStep).toFixed(2))))}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-lg font-bold shrink-0 hover:bg-white/30 active:scale-95 transition-all"
                aria-label="Aumentar zoom"
              >
                +
              </button>
              <span className="text-white text-xs font-semibold w-9 text-right shrink-0">
                {zoomLevel.toFixed(1)}x
              </span>
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className="relative z-20 flex items-center justify-center gap-8 px-6 pb-10 pt-4">
          {/* Flash button */}
          <button
            className="flex items-center justify-center w-12 h-12 rounded-full bg-black/30 backdrop-blur-md text-white transition-colors hover:bg-black/50 active:scale-95"
            aria-label="Flash"
          >
            <Zap className="w-5 h-5" />
          </button>

          {/* Record button */}
          <button
            onClick={handleRecordToggle}
            disabled={!cameraReady || isStopping}
            className="relative flex items-center justify-center w-20 h-20 rounded-full transition-all active:scale-95 disabled:opacity-40"
            aria-label={isRecording ? "Parar gravacao" : "Iniciar gravacao"}
          >
            <div
              className={`absolute inset-0 rounded-full border-4 transition-colors ${
                isRecording ? "border-red-400" : "border-white"
              }`}
            />
            <div
              className={`transition-all ${
                isRecording
                  ? "w-7 h-7 rounded-md bg-red-500"
                  : "w-16 h-16 rounded-full bg-red-500"
              }`}
            />
          </button>

          {/* Switch camera */}
          <button
            onClick={handleSwitchCamera}
            disabled={isRecording}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-black/30 backdrop-blur-md text-white transition-colors hover:bg-black/50 active:scale-95 disabled:opacity-40"
            aria-label="Trocar camera"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
        </div>

        {/* Recording hint text */}
        <div className="relative z-20 flex justify-center pb-6">
          <span className="text-white/40 text-xs">
            {isStopping
              ? "Salvando video..."
              : isRecording
                ? `Toque para parar (max ${MAX_RECORDING_SECONDS}s)`
                : cameraReady
                  ? "Toque no botao vermelho para gravar"
                  : ""}
          </span>
        </div>
      </div>
    </div>
  )
}
