"use client"

import { useState } from "react"
import Image from "next/image"
import { Clock, Plus, Check, Flame } from "lucide-react"
import type { Product } from "./product-card"

interface OfferCardProps {
  product: Product
  onAddToCart: (productId: string) => void
  onVideoClick?: (videoUrl: string, productName: string) => void
  onDetailsClick?: (product: Product) => void
  primaryColor?: string
}

export function OfferCard({ product, onAddToCart, onVideoClick, onDetailsClick, primaryColor }: OfferCardProps) {
  const [added, setAdded] = useState(false)

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAdded(true)
    onAddToCart(product.id)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (product.videoUrl && onVideoClick) {
      onVideoClick(product.videoUrl, product.name)
    }
  }

  const handleCardClick = () => {
    if (onDetailsClick) {
      onDetailsClick(product)
    }
  }

  return (
    <article
      className="relative flex flex-col rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300"
      onClick={handleCardClick}
    >
      {/* Animated gradient border background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/50 via-transparent to-primary/50 opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Inner card with glassmorphism */}
      <div className="relative flex flex-col m-[1px] h-[calc(100%-2px)] rounded-[15px] bg-white/80 dark:bg-card/90 backdrop-blur-xl overflow-hidden border border-white/50 dark:border-border/50">
        
        {/* Fire Badge */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold shadow-lg animate-pulse">
          <Flame className="w-3 h-3" />
          OFERTA
        </div>

        {/* Video/Image Area */}
        <div
          className="relative aspect-square w-full bg-foreground/5 overflow-hidden cursor-pointer"
          onClick={product.videoUrl ? handleVideoClick : undefined}
        >
          {product.videoUrl ? (
            <video
              src={product.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          )}

          {/* Bottom gradient fade to blend with card */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/90 dark:from-card/95 to-transparent pointer-events-none" />
        </div>

        {/* Product Info */}
        <div className="flex flex-col flex-1 p-3 md:p-4 relative z-10 bg-white/80 dark:bg-card/90 backdrop-blur-xl">
          <h3 className="text-sm md:text-base font-extrabold text-foreground leading-tight line-clamp-2 drop-shadow-sm mb-1">
            {product.name}
          </h3>

          {/* Price and Add */}
          <div className="flex items-end justify-between mt-auto gap-1 pt-1">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] md:text-[11px] text-muted-foreground line-through truncate opacity-80">
                R${" "}
                {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm md:text-lg font-black text-orange-600 dark:text-orange-500 leading-none drop-shadow-sm">
                R${" "}
                {(product.offerPrice || product.price).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="text-[9px] md:text-xs font-semibold text-muted-foreground/80 block md:inline md:ml-1">
                  /{product.unit}
                </span>
              </span>
            </div>

            <button
              onClick={handleAdd}
              disabled={added}
              className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 transition-all duration-300 shadow-md ${
                added
                  ? "shadow-green-500/30"
                  : "hover:brightness-110 active:scale-90"
              }`}
              style={{
                backgroundColor: added ? "#22c55e" : primaryColor || "#f97316", // Fallback to orange if no primaryColor
                color: added ? "#ffffff" : "#ffffff",
                transform: added ? "scale(1.15)" : "scale(1)",
              }}
              aria-label={`Adicionar ${product.name}`}
            >
              {added ? (
                <Check className="w-4 h-4 animate-in zoom-in duration-300" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
