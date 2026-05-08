"use client"

import { useState } from "react"
import Image from "next/image"
import { Clock, Plus, Check, Heart } from "lucide-react"

// Product interface for catalog items
export interface Product {
  id: string
  name: string
  category: string
  price: number
  unit: string
  rating: number
  reviewCount: number
  image: string
  freshTimestamp: string
  isLive?: boolean
  isOffer?: boolean
  offerPrice?: number
  videoUrl?: string
}

interface ProductCardProps {
  product: Product
  onAddToCart: (productId: string) => void
  onVideoClick?: (videoUrl: string, productName: string) => void
  onDetailsClick?: (product: Product) => void
  primaryColor?: string
  isFavorite?: boolean
  onToggleFavorite?: (productId: string) => void
}

export function ProductCard({ product, onAddToCart, onVideoClick, onDetailsClick, primaryColor, isFavorite, onToggleFavorite }: ProductCardProps) {
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
      className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Video-style area */}
      <div
        className="relative aspect-[3/4] bg-foreground/5 overflow-hidden group cursor-pointer"
        onClick={product.videoUrl ? handleVideoClick : undefined}
        role={product.videoUrl ? "button" : undefined}
        tabIndex={product.videoUrl ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" && product.videoUrl && onVideoClick) {
            e.stopPropagation()
            onVideoClick(product.videoUrl, product.name)
          }
        }}
        aria-label={product.videoUrl ? `Abrir video de ${product.name}` : undefined}
      >
        {/* Render real video if videoUrl exists, otherwise show image */}
        {product.videoUrl ? (
          <video
            src={product.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Image
            src={product.image}
            alt={`Video de frescor: ${product.name}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        )}

        {/* Dark overlay for video feel — only when video exists */}
        {product.videoUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-foreground/10" />
        )}

        {/* Freshness timestamp badge — only when video exists */}
        {product.videoUrl && (
          <div className="absolute top-2.5 left-2.5">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold backdrop-blur-md shadow-lg ${
                product.isLive
                  ? "bg-red-500/90 text-card"
                  : "bg-card/90 text-foreground"
              }`}
            >
              {product.isLive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-card opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-card" />
                  </span>
                  AO VIVO
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-primary" />
                  {product.freshTimestamp}
                </>
              )}
            </div>
          </div>
        )}

        {/* Top Right Badges (Favorite & Offer) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end z-10">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(product.id)
              }}
              className="p-1.5 rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50 transition-colors shadow-sm"
              aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart className={`w-4 h-4 transition-all duration-300 ${isFavorite ? "fill-red-500 text-red-500 scale-110" : ""}`} />
            </button>
          )}

          {/* Offer badge */}
          {product.isOffer && (
            <div className="px-2 py-1 rounded-lg bg-accent text-accent-foreground text-[11px] font-bold shadow-lg">
              OFERTA
            </div>
          )}
        </div>

        {/* Video progress bar — only when video exists */}
        {product.videoUrl && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-card/20">
            <div className="h-full w-1/3 bg-primary rounded-r-full" />
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex flex-col gap-1 p-2 md:gap-1.5 md:p-3">
        <h3 className="text-[11px] md:text-sm font-semibold text-foreground leading-tight line-clamp-1">
          {product.name}
        </h3>

        {/* Price and Add button */}
        <div className="flex items-end justify-between mt-auto gap-1">
          <div className="flex flex-col min-w-0">
            {product.isOffer && product.offerPrice && (
              <span className="text-[9px] md:text-[11px] text-muted-foreground line-through truncate">
                R${" "}
                {product.price.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            )}
            <span className="text-xs md:text-base font-bold text-foreground leading-none">
              R${" "}
              {(product.isOffer && product.offerPrice
                ? product.offerPrice
                : product.price
              ).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <span className="text-[10px] md:text-xs font-normal text-muted-foreground block md:inline">
                /{product.unit}
              </span>
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={added}
            className={`flex items-center justify-center w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl shrink-0 transition-all duration-300 ${
              added
                ? "shadow-md shadow-green-500/20"
                : "hover:brightness-110 active:scale-95"
            }`}
            style={{
              backgroundColor: added ? "#22c55e" : primaryColor || undefined,
              color: added ? "#ffffff" : primaryColor ? "#ffffff" : undefined,
              transform: added ? "scale(1.1)" : "scale(1)",
            }}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            {added ? (
              <Check className="w-3 h-3 md:w-4 md:h-4 animate-in zoom-in duration-300" />
            ) : (
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
