"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { StoreHeader } from "@/components/store-header"
import { SearchAndFilters, type CategoryFilter } from "@/components/search-and-filters"
import { ProductGrid } from "@/components/product-grid"
import { ProductCard, type Product } from "@/components/product-card"
import { OfferCard } from "@/components/offer-card"
import { supabase } from "@/lib/supabase"
import { Loader2, WifiOff, RefreshCw, Store, Tag, Clock, AlertCircle } from "lucide-react"
import { getProductImage, formatFreshTimestamp } from "@/lib/product-utils"
import { FullScreenVideoPlayer } from "@/components/fullscreen-video-player"
import { CartDrawer, type CartItem } from "@/components/cart-drawer"
import { ProductDetailsModal } from "@/components/product-details-modal"
import { AppFooter } from "@/components/app-footer"
import { Skeleton } from "@/components/ui/skeleton"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"

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
  tipo_servico?: "entrega" | "retirada" | "ambos"
}

export default function StoreCatalog() {
  const params = useParams()
  const slug = params?.slug as string

  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [categories, setCategories] = useState<CategoryFilter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  
  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [fullscreenVideo, setFullscreenVideo] = useState<{ url: string; name: string } | null>(null)
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  
  const [storeDonoId, setStoreDonoId] = useState<string>("")

  // Carrega favoritos do localStorage quando o componente é montado
  useEffect(() => {
    const savedFavs = localStorage.getItem("hortifruti_favorites")
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs))
      } catch (e) {}
    }
  }, [])

  const handleToggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(productId)
      const newFavs = isFav ? prev.filter(id => id !== productId) : [...prev, productId]
      localStorage.setItem("hortifruti_favorites", JSON.stringify(newFavs))
      return newFavs
    })
  }

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems])

  const isStoreOpen = useMemo(() => {
    if (!settings?.horario_abertura || !settings?.horario_fechamento) return true
    
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const [openH, openM] = settings.horario_abertura.split(":").map(Number)
    const [closeH, closeM] = settings.horario_fechamento.split(":").map(Number)
    
    const openTime = openH * 60 + openM
    const closeTime = closeH * 60 + closeM
    
    return currentTime >= openTime && currentTime <= closeTime
  }, [settings])

  const fetchData = async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)

    try {
      // Pequeno delay artificial para evitar flicker e permitir visualização do Skeleton localmente
      await new Promise(resolve => setTimeout(resolve, 600))

      // 1. Acha a Loja (ESSENCIAL - depende apenas do slug)
      const { data: lojaData, error: lojaError } = await supabase
        .from("lojas")
        .select("*")
        .eq("slug", slug)
        .single()

      if (lojaError || !lojaData) throw new Error("Loja não encontrada")

      const donoId = lojaData.dono_id
      setStoreDonoId(donoId)

      // 2, 3 e 4. Busca Dados em PARALELO (todos dependem do donoId)
      const [productsRes, configRes, categoriesRes] = await Promise.all([
        supabase
          .from("produtos")
          .select("*")
          .eq("dono_id", donoId)
          .order("created_at", { ascending: false }),
        supabase
          .from("configuracoes")
          .select("*")
          .eq("dono_id", donoId)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("categorias")
          .select("*")
          .eq("dono_id", donoId)
          .order("nome", { ascending: true })
      ])

      // Processa Produtos
      if (productsRes.data) {
        setProducts(productsRes.data.map(mapRowToProduct))
      }

      // Processa Configurações
      const settingsData = configRes.data
      if (settingsData) {
        setSettings({
          nome_loja: settingsData?.nome_loja || lojaData.name,
          telefone_whatsapp: String(settingsData?.telefone_whatsapp ?? "5511999999999"),
          taxa_entrega: Number(settingsData?.taxa_entrega ?? 0),
          logo_url: settingsData?.logo_url ? String(settingsData?.logo_url) : undefined,
          cor_primaria: settingsData?.cor_primaria ? String(settingsData?.cor_primaria) : undefined,
          tipo_servico: (settingsData?.tipo_servico as "entrega" | "retirada" | "ambos") ?? "ambos",
          horario_abertura: settingsData?.horario_abertura,
          horario_fechamento: settingsData?.horario_fechamento,
        })
      }

      // Processa Categorias
      if (categoriesRes.data) {
        setCategories(categoriesRes.data.map((row) => ({ id: String(row.id), nome: String(row.nome ?? "") })))
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
      
      if (activeCategory === "favoritos") return matchesSearch && favorites.includes(p.id)
      if (activeCategory === "ofertas") return matchesSearch && p.isOffer
      
      const matchesCategory = activeCategory === "all" || p.category === activeCategory
      
      // Evita duplicidade: oculta ofertas do grid se elas já estiverem no carrossel de cima
      if (activeCategory === "all" && !searchQuery && p.isOffer) {
        return false
      }

      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, activeCategory, favorites])

  const offerProducts = useMemo(() => products.filter(p => p.isOffer), [products])

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
      
      {!isLoading && !isStoreOpen && settings?.horario_abertura && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <Clock className="w-4 h-4 text-orange-600 shrink-0" />
          <p className="text-[11px] font-medium text-orange-700 leading-tight">
            Loja fechada no momento. Abre às {settings.horario_abertura}. 
            Você pode montar seu carrinho, mas a finalização está pausada.
          </p>
        </div>
      )}

      <StoreHeader
        storeName={settings?.nome_loja || "Carregando..."}
        userName="Cliente"
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        logoUrl={settings?.logo_url}
        primaryColor={settings?.cor_primaria}
      />

      <SearchAndFilters
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categories={categories}
        primaryColor={settings?.cor_primaria}
      />

      <section aria-label="Produtos disponiveis" className="pt-2">
        {isLoading && (
          <div className="grid grid-cols-3 gap-2 px-3 pb-8 md:grid-cols-3 md:gap-3 md:px-4 lg:grid-cols-4 pt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
                <Skeleton className="aspect-[3/4] w-full rounded-none" />
                <div className="flex flex-col gap-1 p-2 md:gap-1.5 md:p-3">
                  <Skeleton className="h-3 md:h-4 w-3/4 rounded-lg" />
                  <div className="flex items-end justify-between mt-auto pt-2 gap-1">
                    <div className="flex flex-col w-full gap-1 md:gap-1.5">
                      <Skeleton className="h-2 md:h-3 w-1/2 rounded-lg" />
                      <Skeleton className="h-4 md:h-5 w-2/3 rounded-lg" />
                    </div>
                    <Skeleton className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl shrink-0" />
                  </div>
                </div>
              </div>
            ))}
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
            {offerProducts.length > 0 && activeCategory === "all" && !searchQuery && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 px-4 pb-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-500">
                    <Tag className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-foreground">Ofertas do Dia</h2>
                </div>
                <Carousel
                  opts={{
                    align: "start",
                    dragFree: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-3 pr-4">
                    {offerProducts.map((product) => (
                      <CarouselItem key={product.id} className="pl-3 basis-[55%] sm:basis-[45%] md:basis-[30%] lg:basis-[22%]">
                        <OfferCard
                          product={product}
                          onAddToCart={handleAddToCart}
                          onVideoClick={handleVideoClick}
                          onDetailsClick={handleDetailsClick}
                          primaryColor={settings?.cor_primaria}
                          isFavorite={favorites.includes(product.id)}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            )}

            <div className="flex items-center justify-between px-4 pb-3">
              <h2 className="text-sm font-semibold text-foreground">
                {activeCategory === "ofertas" ? "Todas as Ofertas" : "Fresquinhos para voce"}
              </h2>
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
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </>
        )}
      </section>

      {fullscreenVideo && (
        <FullScreenVideoPlayer videoUrl={fullscreenVideo.url} productName={fullscreenVideo.name} isOpen={!!fullscreenVideo} onClose={handleCloseVideo} />
      )}
      <ProductDetailsModal product={detailsProduct} isOpen={!!detailsProduct} onClose={handleCloseDetails} onAddToCart={handleAddToCart} primaryColor={settings?.cor_primaria} />
      
      <AppFooter primaryColor={settings?.cor_primaria} />

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
          tipoServico={settings?.tipo_servico ?? "ambos"}
          donoId={storeDonoId}
          isStoreOpen={isStoreOpen}
        />
      )}
    </div>
  )
}