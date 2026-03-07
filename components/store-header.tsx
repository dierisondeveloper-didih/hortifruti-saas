"use client"

import Image from "next/image"
import { ShoppingCart, Leaf } from "lucide-react"

interface StoreHeaderProps {
  storeName?: string
  userName: string
  cartCount: number
  onCartClick?: () => void
  logoUrl?: string
  primaryColor?: string
}

export function StoreHeader({
  storeName = "Hortifruti Online",
  userName,
  cartCount,
  onCartClick,
  logoUrl,
  primaryColor,
}: StoreHeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md border-b border-border"
      style={{ backgroundColor: primaryColor ? `${primaryColor}ee` : undefined }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <div className="flex items-center justify-center h-10 w-10 overflow-hidden rounded-full border-2 border-white/30 bg-white">
              <img
                src={logoUrl}
                alt={storeName}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ backgroundColor: primaryColor ? "rgba(255,255,255,0.2)" : undefined }}
            >
              <Leaf className="w-5 h-5 text-primary-foreground" style={{ color: primaryColor ? "#fff" : undefined }} />
            </div>
          )}
          <div>
            <h1
              className="text-base font-bold leading-tight line-clamp-1"
              style={{ color: primaryColor ? "#fff" : undefined }}
            >
              {storeName}
            </h1>
            <p
              className="text-xs leading-tight"
              style={{ color: primaryColor ? "rgba(255,255,255,0.8)" : undefined }}
            >
              {"Ola, "}
              <span
                className="font-semibold"
                style={{ color: primaryColor ? "#fff" : undefined }}
              >
                {userName}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={onCartClick}
          className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors"
          style={{
            backgroundColor: primaryColor ? "rgba(255,255,255,0.2)" : undefined,
          }}
          aria-label={`Carrinho com ${cartCount} itens`}
        >
          <ShoppingCart
            className="w-5 h-5"
            style={{ color: primaryColor ? "#fff" : undefined }}
          />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-bold bg-red-500 text-white rounded-full animate-in zoom-in duration-200">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
