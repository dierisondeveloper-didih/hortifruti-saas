"use client"

import { ProductCard, type Product } from "./product-card"

interface ProductGridProps {
  products: Product[]
  onAddToCart: (productId: string) => void
  onVideoClick?: (videoUrl: string, productName: string) => void
  onDetailsClick?: (product: Product) => void
  primaryColor?: string
}

export function ProductGrid({ products, onAddToCart, onVideoClick, onDetailsClick, primaryColor }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <span className="text-2xl" role="img" aria-label="Triste">
            {":/"}
          </span>
        </div>
        <p className="text-sm font-medium text-foreground">
          Nenhum produto encontrado
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Tente buscar por outro termo ou categoria
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-8 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onVideoClick={onVideoClick}
          onDetailsClick={onDetailsClick}
          primaryColor={primaryColor}
        />
      ))}
    </div>
  )
}
