"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ProductImagePlaceholder } from "./product-image-placeholder"

interface ProductImageProps {
  src?: string
  name: string
  sizes?: string
  className?: string
  compact?: boolean
}

/**
 * Imagem de produto resiliente: tenta carregar `src`; se estiver vazia
 * ou falhar (404, rede, imagem-base ainda não enviada ao Storage),
 * cai graciosamente no placeholder honesto — nunca mostra imagem quebrada.
 */
export function ProductImage({
  src,
  name,
  sizes = "(max-width: 768px) 50vw, 33vw",
  className = "object-cover",
  compact = false,
}: ProductImageProps) {
  const [errored, setErrored] = useState(false)

  // Se a src mudar (ex: produto editado), reseta o estado de erro
  useEffect(() => {
    setErrored(false)
  }, [src])

  const hasSrc = typeof src === "string" && src.trim().length > 0

  if (!hasSrc || errored) {
    return <ProductImagePlaceholder name={name} compact={compact} />
  }

  return (
    <Image
      src={src}
      alt={name}
      fill
      className={className}
      sizes={sizes}
      onError={() => setErrored(true)}
      unoptimized
    />
  )
}
