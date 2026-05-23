"use client"

import { useState } from "react"
import { Plus, Check, Flame, Heart, Play } from "lucide-react"
import type { Product } from "./product-card"
import { ProductImage } from "./product-image"

interface OfferCardProps {
  product: Product
  onAddToCart: (productId: string) => void
  onVideoClick?: (videoUrl: string, productName: string) => void
  onDetailsClick?: (product: Product) => void
  primaryColor?: string
  isFavorite?: boolean
  onToggleFavorite?: (productId: string) => void
}

export function OfferCard({ product, onAddToCart, onVideoClick, onDetailsClick, primaryColor, isFavorite, onToggleFavorite }: OfferCardProps) {
  const [added, setAdded] = useState(false)

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAdded(true)
    onAddToCart(product.id)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleMediaClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (product.videoUrl && onVideoClick) {
      onVideoClick(product.videoUrl, product.name)
    } else if (onDetailsClick) {
      onDetailsClick(product)
    }
  }

  const handleCardClick = () => {
    if (onDetailsClick) onDetailsClick(product)
  }

  const discount =
    product.offerPrice && product.price > 0
      ? Math.round((1 - product.offerPrice / product.price) * 100)
      : 0

  return (
    <div className="relative offer-neon-wrap">
      <style>{`
        @keyframes offer-neon-pulse {
          0%, 100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }
        @keyframes offer-neon-sweep {
          0%   { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        .offer-neon-wrap::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 1rem;
          padding: 2px;
          background: linear-gradient(135deg,
            ${primaryColor || "#2d8a4e"},
            ${primaryColor ? `${primaryColor}aa` : "#f97316"},
            ${primaryColor || "#2d8a4e"});
          background-size: 300% 300%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: offer-neon-pulse 3.2s ease-in-out infinite, offer-neon-sweep 6s linear infinite;
          pointer-events: none;
          z-index: 20;
        }
      `}</style>
      <article
        className="relative flex flex-row rounded-2xl overflow-hidden cursor-pointer group bg-card shadow-sm transition-all duration-300 h-32 z-10"
        onClick={handleCardClick}
        style={{
          boxShadow: primaryColor 
            ? `inset 0 0 16px -2px ${primaryColor}88` 
            : "inset 0 0 16px -2px oklch(0.72 0.19 145 / 0.55), inset 0 0 4px oklch(0.80 0.17 90 / 0.4)",
        }}
      >
      {/* Media (left) */}
      <div
        className="relative h-full w-32 shrink-0 bg-foreground/5 overflow-hidden"
        onClick={product.videoUrl ? handleMediaClick : undefined}
      >
        {product.videoUrl ? (
          <video
            src={product.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <ProductImage
            src={product.image}
            name={product.name}
            sizes="128px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            compact
          />
        )}

        {/* Play hint when there's a video */}
        {product.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Discount stamp */}
        {discount > 0 && (
          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-offer text-offer-foreground text-[10px] font-black shadow-sm">
            -{discount}%
          </div>
        )}
      </div>

      {/* Info (right) */}
      <div className="relative flex flex-col flex-1 min-w-0 p-3">
        {/* Top row: badge + favorite */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold shadow-sm">
            <Flame className="w-3 h-3" />
            OFERTA
          </div>
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(product.id)
              }}
              className="p-1 -mr-1 -mt-0.5 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
              aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart className={`w-4 h-4 transition-all duration-300 ${isFavorite ? "fill-red-500 text-red-500 scale-110" : ""}`} />
            </button>
          )}
        </div>

        {/* Name */}
        <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2 mt-1.5">
          {product.name}
        </h3>

        {/* Price + add */}
        <div className="flex items-end justify-between mt-auto gap-2">
          <div className="flex flex-col min-w-0">
            {product.offerPrice && (
              <span className="text-[11px] text-muted-foreground line-through truncate leading-none mb-0.5">
                R${" "}
                {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            <span className="text-lg font-black text-offer leading-none">
              R${" "}
              {(product.offerPrice || product.price).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <span className="text-[11px] font-semibold text-muted-foreground ml-1">
                /{product.unit}
              </span>
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={added}
            className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-all duration-300 shadow-md ${
              added ? "shadow-green-500/30" : "hover:brightness-110 active:scale-90"
            }`}
            style={{
              backgroundColor: added ? "#22c55e" : primaryColor || "#f97316",
              color: "#ffffff",
              transform: added ? "scale(1.12)" : "scale(1)",
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
    </article>
    </div>
  )
}
