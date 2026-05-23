"use client"

import { Sprout } from "lucide-react"

interface ProductImagePlaceholderProps {
  name?: string
  className?: string
  compact?: boolean
}

/**
 * Placeholder honesto para produtos sem imagem real.
 * Em vez de mostrar uma foto aleatória (que quebra a confiança do cliente),
 * mostra um visual neutro e agradável com o nome do produto.
 */
export function ProductImagePlaceholder({
  name,
  className = "",
  compact = false,
}: ProductImagePlaceholderProps) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-secondary to-secondary/40 ${className}`}
      aria-hidden="true"
    >
      <Sprout className={compact ? "w-6 h-6 text-primary/40" : "w-10 h-10 text-primary/40"} />
      {!compact && name && (
        <span className="text-[11px] font-medium text-muted-foreground/70 text-center px-2 line-clamp-2 max-w-full">
          {name}
        </span>
      )}
    </div>
  )
}
