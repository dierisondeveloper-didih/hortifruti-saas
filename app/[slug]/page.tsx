"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { StoreHeader } from "@/components/store-header"
import { SearchAndFilters, type CategoryFilter } from "@/components/search-and-filters"
import { ProductGrid } from "@/components/product-grid"
import type { Product } from "@/components/product-card"
import { supabase } from "@/lib/supabase"
import { Loader2, WifiOff, RefreshCw, Store } from "lucide-react"
import { getProductImage, formatFreshTimestamp } from "@/lib/product-utils"
import { FullScreenVideoPlayer } from "@/components/fullscreen-video-player"
import { CartDrawer, type CartItem } from "@/components/cart-drawer"
import { ProductDetailsModal } from "@/components/product-details-modal"

function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash % 1000) / 1000
}

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
    rating: 3.5 + rand * 1.5,
    reviewCount: Math.floor(20 + rand * 250),
    image: row.imagem_url ? String(row.imagem_url) : getProductImage(name),
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

export default function StoreCatalog() {
  const params = useParams()
  const slug = params?.slug as string

  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [categories, setCategories] = useState<CategoryFilter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [fullscreenVideo, setFullscreenVideo] = useState<{ url: string; name: string } | null>(null)
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null)
  
  const [storeDonoId, setStoreDonoId] = useState<string>("")

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems])

  const fetchData = async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)

    try {
      // 1. Acha a Loja
      const { data: lojaData, error: lojaError } = await supabase
        .from("lojas")
        .select("*")
        .eq("slug", slug)
        .single()

      if (lojaError || !lojaData) throw new Error("Loja não encontrada")

      const donoId = lojaData.dono_id
      setStoreDonoId(donoId)

      // 2. Busca Produtos
      const { data: productsData } = await supabase
        .from("produtos")
        .select("*")
        .eq("dono_id", donoId)
        .order("criado_em", { ascending: false })

      if (productsData) {
        setProducts(productsData.map(mapRowToProduct))
      }

      // 3. Busca Configurações (Pegando sempre a ÚLTIMA salva no banco para evitar duplicidades antigas)
      const { data: configArray, error: configError } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("dono_id", donoId)
        
      if (!configError && configArray && configArray.length > 0) {
        const settingsData = configArray[configArray.length - 1]

        setSettings({
          nome_loja: settingsData?.nome_loja || lojaData.name,
          telefone_whatsapp: String(settingsData?.telefone_whatsapp ?? "5511999999999"),
          taxa_entrega: Number(settingsData?.taxa_entrega ?? 0),
          logo_url: settingsData?.logo_url ? String(settingsData?.logo_url) : undefined,
          cor_primaria: settingsData?.cor_primaria ? String(settingsData?.cor_primaria) : undefined,
        })
      }

      // 4. Busca Categorias
      const { data: categoriesData } = await supabase
        .from("categorias")
        .select("*")
        .eq("dono_id", donoId)
        .order("nome", { ascending: true })

      if (categoriesData) {
        setCategories(categoriesData.map((row) => ({ id: String(row.id), nome: String(row.nome ?? "") })))
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar o catálogo")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [slug])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      if (activeCategory === "ofertas") return matchesSearch && p.isOffer
      const matchesCategory = activeCategory === "all" || p.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, activeCategory])

  const handleAddToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === productId)
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return
    setCartItems((prev) => prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const handleClearCart = () => setCartItems([])
  const handleVideoClick = (videoUrl: string, productName: string) => setFullscreenVideo({ url: videoUrl, name: productName })
  const handleCloseVideo = () => setFullscreenVideo(null)
  const handleDetailsClick = (product: Product) => setDetailsProduct(product)
  const handleCloseDetails = () => setDetailsProduct(null)

  if (!isLoading && error === "Loja não encontrada") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Store className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Loja não encontrada</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Verifique se o link está correto ou se a loja ainda está ativa na nossa plataforma.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-20">
      
      <StoreHeader
        storeName={settings?.nome_loja || "Carregando..."}
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
        primaryColor={settings?.cor_primaria}
      />

      <section aria-label="Produtos disponiveis" className="pt-2">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando produtos frescos...</p>
          </div>
        )}

        {!isLoading && error && error !== "Loja não encontrada" && (
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Erro ao carregar produtos</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="flex items-center justify-between px-4 pb-3">
              <h2 className="text-sm font-semibold text-foreground">Fresquinhos para voce</h2>
              <span className="text-xs text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? "produto" : "produtos"}
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

      {fullscreenVideo && (
        <FullScreenVideoPlayer videoUrl={fullscreenVideo.url} productName={fullscreenVideo.name} isOpen={!!fullscreenVideo} onClose={handleCloseVideo} />
      )}
      <ProductDetailsModal product={detailsProduct} isOpen={!!detailsProduct} onClose={handleCloseDetails} onAddToCart={handleAddToCart} primaryColor={settings?.cor_primaria} />
      
      {storeDonoId && (
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
          donoId={storeDonoId}
        />
      )}
    </div>
  )
}