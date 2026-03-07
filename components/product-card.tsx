"use client"

import { useState } from "react"
import Image from "next/image"
import { Play, Clock, Plus, Check } from "lucide-react"

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
}

export function ProductCard({ product, onAddToCart, onVideoClick, onDetailsClick, primaryColor }: ProductCardProps) {
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
        onClick={handleVideoClick}
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

        {/* Dark overlay for video feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-foreground/10" />

        {/* Play button - only show if no video */}
        {!product.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-card/20 backdrop-blur-md border border-card/30 transition-transform group-hover:scale-110">
              <Play className="w-5 h-5 text-card fill-card ml-0.5" />
            </div>
          </div>
        )}

        {/* Freshness timestamp badge */}
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

        {/* Offer badge */}
        {product.isOffer && (
          <div className="absolute top-2.5 right-2.5">
            <div className="px-2 py-1 rounded-lg bg-accent text-accent-foreground text-[11px] font-bold shadow-lg">
              OFERTA
            </div>
          </div>
        )}

        {/* Video progress bar simulation */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-card/20">
          <div className="h-full w-1/3 bg-primary rounded-r-full" />
        </div>
      </div>

      {/* Product info */}
      <div className="flex flex-col gap-1.5 p-3">
        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
          {product.name}
        </h3>

        {/* Price and Add button */}
        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col">
            {product.isOffer && product.offerPrice && (
              <span className="text-[11px] text-muted-foreground line-through">
                R${" "}
                {product.price.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                /{product.unit}
              </span>
            )}
            <span className="text-base font-bold text-foreground">
              R${" "}
              {(product.isOffer && product.offerPrice
                ? product.offerPrice
                : product.price
              ).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <span className="text-xs font-normal text-muted-foreground">
                /{product.unit}
              </span>
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={added}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
              added
                ? "bg-accent text-accent-foreground scale-95"
                : "hover:brightness-110 active:scale-95"
            }`}
            style={{
              backgroundColor: added ? undefined : primaryColor || undefined,
              color: added ? undefined : primaryColor ? "#fff" : undefined,
            }}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            {added ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
