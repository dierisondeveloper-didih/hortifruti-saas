"use client"

import { useState, useEffect, useMemo } from "react"
import { StoreHeader } from "@/components/store-header"
import { SearchAndFilters, type CategoryFilter } from "@/components/search-and-filters"
import { ProductGrid } from "@/components/product-grid"
import type { Product } from "@/components/product-card"
import { supabase } from "@/lib/supabase"
import { Loader2, WifiOff, RefreshCw } from "lucide-react"
import { getProductImage, formatFreshTimestamp } from "@/lib/product-utils"
import { FullScreenVideoPlayer } from "@/components/fullscreen-video-player"
import { CartDrawer, type CartItem } from "@/components/cart-drawer"
import { ProductDetailsModal } from "@/components/product-details-modal"

/**
 * Generates a deterministic pseudo-random number from a string seed
 * so the same product always gets the same rating/image.
 */
function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash % 1000) / 1000
}

/**
 * Maps a row from the Supabase `produtos` table to the
 * front-end Product interface expected by ProductCard.
 *
 * DB columns used: id, nome, preco, unidade, categoria, ultimo_video_em, em_oferta, preco_oferta
 * Columns NOT in DB yet (generated client-side): image, rating, reviewCount
 */
function mapRowToProduct(row: Record<string, unknown>): Product {
  const name = String(row.nome ?? "")
  const rand = seededRandom(name + String(row.id))
  const { label, isLive } = formatFreshTimestamp(row.ultimo_video_em)

  return {
    id: String(row.id),
    name,
    category: String(row.categoria ?? ""),
    price: Number(row.preco ?? 0),
    unit: String(row.unidade ?? "kg"),
    rating: 3.5 + rand * 1.5,                   // between 3.5 and 5.0
    reviewCount: Math.floor(20 + rand * 250),    // between 20 and 270
    image: getProductImage(name),
    freshTimestamp: label,
    isLive,
    isOffer: Boolean(row.em_oferta),
    offerPrice: row.preco_oferta ? Number(row.preco_oferta) : undefined,
    videoUrl: row.video_url ? String(row.video_url) : undefined,
  }
}

interface StoreSettings {
  nome_loja: string
  telefone_whatsapp: string
  taxa_entrega: number
  logo_url?: string
  cor_primaria?: string
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [categories, setCategories] = useState<CategoryFilter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [fullscreenVideo, setFullscreenVideo] = useState<{
    url: string
    name: string
  } | null>(null)
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null)

  // Calculate cart count from items
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  )

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from("produtos")
        .select("*")
        .order("criado_em", { ascending: false })

      if (productsError) {
        setError(productsError.message)
        setProducts([])
      } else {
        setProducts((productsData ?? []).map(mapRowToProduct))
      }

      // Fetch store settings
      const { data: settingsData } = await supabase
        .from("configuracoes")
        .select("*")
        .limit(1)
        .single()

      if (settingsData) {
        setSettings({
          nome_loja: String(settingsData.nome_loja ?? "Hortifruti Online"),
          telefone_whatsapp: String(settingsData.telefone_whatsapp ?? ""),
          taxa_entrega: Number(settingsData.taxa_entrega ?? 0),
          logo_url: settingsData.logo_url ? String(settingsData.logo_url) : undefined,
          cor_primaria: settingsData.cor_primaria ? String(settingsData.cor_primaria) : undefined,
        })
      }

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from("categorias")
        .select("*")
        .order("nome", { ascending: true })

      if (categoriesData) {
        setCategories(
          categoriesData.map((row) => ({
            id: String(row.id),
            nome: String(row.nome ?? ""),
          }))
        )
      }

      setIsLoading(false)
    }

    fetchData()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())

      if (activeCategory === "ofertas") {
        return matchesSearch && p.isOffer
      }

      const matchesCategory =
        activeCategory === "all" || p.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, activeCategory])

  const handleAddToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === productId)
      if (existingItem) {
        // Increase quantity if already in cart
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      // Add new item with quantity 1
      return [...prev, { product, quantity: 1 }]
    })
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const handleClearCart = () => {
    setCartItems([])
  }

  const handleVideoClick = (videoUrl: string, productName: string) => {
    setFullscreenVideo({ url: videoUrl, name: productName })
  }

  const handleCloseVideo = () => {
    setFullscreenVideo(null)
  }

  const handleDetailsClick = (product: Product) => {
    setDetailsProduct(product)
  }

  const handleCloseDetails = () => {
    setDetailsProduct(null)
  }

  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    supabase
      .from("produtos")
      .select("*")
      .order("criado_em", { ascending: false })
      .then(({ data, error: supaError }) => {
        if (supaError) {
          setError(supaError.message)
          setProducts([])
        } else {
          setProducts((data ?? []).map(mapRowToProduct))
        }
        setIsLoading(false)
      })
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <StoreHeader
        storeName={settings?.nome_loja}
        userName="Cliente"
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        logoUrl={settings?.logo_url}
        primaryColor={settings?.cor_primaria}
      />

      <SearchAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categories={categories}
      />

      <section aria-label="Produtos disponiveis" className="pt-2">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Carregando produtos frescos...
            </p>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Erro ao carregar produtos
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {error}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Success state */}
        {!isLoading && !error && (
          <>
            <div className="flex items-center justify-between px-4 pb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Fresquinhos para voce
              </h2>
              <span className="text-xs text-muted-foreground">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "produto" : "produtos"}
              </span>
            </div>
            <ProductGrid
              products={filteredProducts}
              onAddToCart={handleAddToCart}
              onVideoClick={handleVideoClick}
              onDetailsClick={handleDetailsClick}
              primaryColor={settings?.cor_primaria}
            />
          </>
        )}
      </section>

      {/* Fullscreen video player */}
      {fullscreenVideo && (
        <FullScreenVideoPlayer
          videoUrl={fullscreenVideo.url}
          productName={fullscreenVideo.name}
          isOpen={!!fullscreenVideo}
          onClose={handleCloseVideo}
        />
      )}

      {/* Product details modal */}
      <ProductDetailsModal
        product={detailsProduct}
        isOpen={!!detailsProduct}
        onClose={handleCloseDetails}
        onAddToCart={handleAddToCart}
        primaryColor={settings?.cor_primaria}
      />

      {/* Cart drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        deliveryFee={settings?.taxa_entrega ?? 0}
        whatsappNumber={settings?.telefone_whatsapp || "5511999999999"}
        primaryColor={settings?.cor_primaria}
      />
    </div>
  )
}
