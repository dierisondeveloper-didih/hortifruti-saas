"use client"

import { useEffect, useCallback, useState } from "react"
import Image from "next/image"
import { X, ShoppingCart, Check, Tag } from "lucide-react"
import type { Product } from "./product-card"

interface ProductDetailsModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (productId: string) => void
  primaryColor?: string
}

export function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  primaryColor,
}: ProductDetailsModalProps) {
  const [added, setAdded] = useState(false)

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  // Reset added state when product changes
  useEffect(() => {
    setAdded(false)
  }, [product?.id])

  const handleAddToCart = useCallback(() => {
    if (!product) return
    setAdded(true)
    onAddToCart(product.id)
    setTimeout(() => {
      setAdded(false)
      onClose()
    }, 800)
  }, [product, onAddToCart, onClose])

  if (!isOpen || !product) return null

  const displayPrice =
    product.isOffer && product.offerPrice ? product.offerPrice : product.price

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-x-4 top-[10%] bottom-auto max-w-lg mx-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Media area */}
          <div className="relative aspect-video bg-foreground/5 overflow-hidden">
            {product.videoUrl ? (
              <video
                src={product.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
              />
            )}

            {/* Offer badge */}
            {product.isOffer && (
              <div className="absolute top-3 left-3">
                <div className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold shadow-lg">
                  OFERTA
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Name - Full, no truncation */}
            <h2 className="text-xl font-bold text-foreground leading-tight">
              {product.name}
            </h2>

            {/* Category */}
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground capitalize">
                {product.category}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              {product.isOffer && product.offerPrice && (
                <span className="text-base text-muted-foreground line-through">
                  R${" "}
                  {product.price.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              )}
              <span className="text-2xl font-bold text-foreground">
                R${" "}
                {displayPrice.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-sm text-muted-foreground">
                / {product.unit}
              </span>
            </div>

            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              disabled={added}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold transition-all ${
                added
                  ? "bg-accent text-accent-foreground"
                  : "hover:brightness-110 active:scale-[0.98]"
              }`}
              style={{
                backgroundColor: added ? undefined : primaryColor || undefined,
                color: added ? undefined : primaryColor ? "#fff" : undefined,
              }}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  Adicionado!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Adicionar ao Carrinho
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
