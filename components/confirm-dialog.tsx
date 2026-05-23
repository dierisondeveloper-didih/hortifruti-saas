"use client"

import { AlertTriangle, X } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "default"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-xl p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
              variant === "danger" ? "bg-destructive/10" : "bg-primary/10"
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${variant === "danger" ? "text-destructive" : "text-primary"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-title" className="text-base font-bold text-foreground">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold transition-colors hover:bg-secondary/70 active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95 ${
              variant === "danger" ? "bg-destructive" : "bg-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
