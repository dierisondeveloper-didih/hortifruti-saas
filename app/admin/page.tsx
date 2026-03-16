"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { AdminStatusPanel } from "@/components/admin-status-panel"
import { AdminProductList, type AdminProduct } from "@/components/admin-product-list"
import { CameraModal } from "@/components/camera-modal"
import { AdminSidebar, type AdminTab } from "@/components/admin-sidebar"
import { ProductManagement, type ManagedProduct } from "@/components/product-management"
import { type ProductFormData } from "@/components/product-form-modal"
import { supabase } from "@/lib/supabase"
import { getProductImage, formatFreshTimestamp, getVideoStatus } from "@/lib/product-utils"
import { Loader2, WifiOff, RefreshCw, Construction } from "lucide-react"
import { SettingsForm } from "@/components/settings-form"
import { CategoryManagement } from "@/components/category-management"
import { OrdersManagement } from "@/components/orders-management"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AppFooter } from "@/components/app-footer"

function mapRowToAdminProduct(row: Record<string, unknown>): AdminProduct {
  const name = String(row.nome ?? "")
  const { label } = formatFreshTimestamp(row.ultimo_video_em)
  const videoStatus = getVideoStatus(row.ultimo_video_em)

  return {
    id: String(row.id),
    name,
    image: row.imagem_url ? String(row.imagem_url) : getProductImage(name),
    price: Number(row.preco ?? 0),
    unit: String(row.unidade ?? "kg"),
    videoStatus,
    videoTimestamp: label,
  }
}

export default function AdminPage() {
  const router = useRouter()

  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard")

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [managedProducts, setManagedProducts] = useState<ManagedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [cameraProduct, setCameraProduct] = useState<AdminProduct | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/login")
        return
      }

      setIsAuthenticated(true)
      setIsAuthChecking(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push("/")
  }, [router])

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error("Usuário não autenticado")

      const { data, error: supaError } = await supabase
        .from("produtos")
        .select("*")
        .eq("dono_id", user.id) // TRAVA DE SEGURANÇA
        .order("criado_em", { ascending: false })

      if (supaError) {
        throw supaError
      } else {
        const rows = data ?? []
        setProducts(rows.map(mapRowToAdminProduct))
        setManagedProducts(
          rows.map((row) => ({
            id: String(row.id),
            name: String(row.nome ?? ""),
            price: Number(row.preco ?? 0),
            unit: String(row.unidade ?? "kg"),
            stock: Number(row.estoque ?? 0),
            category: String(row.categoria ?? ""),
            image: row.imagem_url ? String(row.imagem_url) : getProductImage(String(row.nome ?? "")),
          }))
        )
      }
    } catch (err: any) {
      setError(err.message)
      setProducts([])
      setManagedProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const outdatedCount = useMemo(
    () => products.filter((p) => p.videoStatus !== "updated").length,
    [products]
  )

  const handleRecordClick = (product: AdminProduct) => {
    setCameraProduct(product)
    setIsCameraOpen(true)
  }

  const handleCameraClose = () => {
    setIsCameraOpen(false)
    setCameraProduct(null)
  }

  const handleAddProduct = useCallback(
    async (data: ProductFormData) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Usuário não autenticado")

        const { error: insertError } = await supabase.from("produtos").insert({
          nome: data.nome,
          preco: data.preco,
          unidade: data.unidade,
          estoque: data.estoque,
          categoria: data.categoria,
          imagem_url: data.imagem_url || null,
          dono_id: user.id // TRAVA DE SEGURANÇA
        })

        if (insertError) {
          alert("Erro ao adicionar produto: " + insertError.message)
          return
        }

        await fetchProducts()
      } catch (err) {
        alert("Erro inesperado: " + (err instanceof Error ? err.message : String(err)))
      }
    },
    [fetchProducts]
  )

  const handleEditProduct = useCallback(
    async (data: ProductFormData) => {
      if (!data.id) {
        alert("Erro: ID do produto não encontrado")
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Usuário não autenticado")

        const { error: updateError } = await supabase
          .from("produtos")
          .update({
            nome: data.nome,
            preco: data.preco,
            unidade: data.unidade,
            estoque: data.estoque,
            categoria: data.categoria,
            imagem_url: data.imagem_url || null,
          })
          .eq("id", data.id)
          .eq("dono_id", user.id) // TRAVA DE SEGURANÇA

        if (updateError) {
          alert("Erro ao atualizar produto: " + updateError.message)
          return
        }

        await fetchProducts()
      } catch (err) {
        alert("Erro inesperado: " + (err instanceof Error ? err.message : String(err)))
      }
    },
    [fetchProducts]
  )

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      const confirmed = window.confirm("Tem certeza que deseja excluir este produto?")
      if (!confirmed) return

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Usuário não autenticado")

        const { error: deleteError } = await supabase
          .from("produtos")
          .delete()
          .eq("id", productId)
          .eq("dono_id", user.id) // TRAVA DE SEGURANÇA

        if (deleteError) {
          alert("Erro ao excluir produto: " + deleteError.message)
          return
        }

        await fetchProducts()
      } catch (err) {
        alert("Erro inesperado: " + (err instanceof Error ? err.message : String(err)))
      }
    },
    [fetchProducts]
  )

  const handleVideoSave = useCallback(
    async (productId: string, videoBlob?: Blob) => {
      setIsSaving(true)

      try {
        if (!videoBlob) {
          const { error: updateError } = await supabase
            .from("produtos")
            .update({ ultimo_video_em: new Date().toISOString() })
            .eq("id", productId)

          if (updateError) alert("Erro ao atualizar produto: " + updateError.message)
          
          await fetchProducts()
          setIsSaving(false)
          setIsCameraOpen(false)
          setCameraProduct(null)
          return
        }

        const timestamp = Date.now()
        const fileName = `${productId}_${timestamp}.webm`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("videos_produtos")
          .upload(fileName, videoBlob, {
            contentType: "video/webm",
            upsert: true,
          })

        if (uploadError) {
          alert("Erro no upload: " + uploadError.message)
          setIsSaving(false)
          setIsCameraOpen(false)
          setCameraProduct(null)
          return
        }

        const { data: urlData } = supabase.storage
          .from("videos_produtos")
          .getPublicUrl(fileName)

        const publicUrl = urlData?.publicUrl

        if (!publicUrl) {
          alert("Erro: Não foi possível obter a URL pública do vídeo")
          setIsSaving(false)
          setIsCameraOpen(false)
          setCameraProduct(null)
          return
        }

        const { error: updateError } = await supabase
          .from("produtos")
          .update({
            ultimo_video_em: new Date().toISOString(),
            video_url: publicUrl,
          })
          .eq("id", productId)

        if (updateError) {
          alert("Erro ao atualizar produto: " + updateError.message)
          setIsSaving(false)
          setIsCameraOpen(false)
          setCameraProduct(null)
          return
        }

        await fetchProducts()

      } catch (err) {
        alert("Erro inesperado: " + (err instanceof Error ? err.message : String(err)))
      } finally {
        setIsSaving(false)
        setIsCameraOpen(false)
        setCameraProduct(null)
      }
    },
    [fetchProducts]
  )

  if (isAuthChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} onLogout={handleLogout} />

      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "dashboard" && <AdminDashboard />}

      {activeTab !== "dashboard" && isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando produtos...</p>
        </div>
      )}

      {activeTab !== "dashboard" && !isLoading && error && (
        <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <WifiOff className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Erro ao carregar produtos</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">{error}</p>
          </div>
          <button
            onClick={fetchProducts}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      )}

      {activeTab !== "dashboard" && !isLoading && !error && (
        <>
          {activeTab === "videos" && (
            <>
              <AdminStatusPanel outdatedCount={outdatedCount} totalCount={products.length} />
              <AdminProductList products={products} onRecordClick={handleRecordClick} />
            </>
          )}

          {activeTab === "products" && (
            <ProductManagement
              products={managedProducts}
              isLoading={false}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === "categories" && <CategoryManagement />}

          {activeTab === "customers" && <OrdersManagement onStockChange={fetchProducts} />}

          {activeTab === "settings" && <SettingsForm />}
        </>
      )}

      {isSaving && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border shadow-lg">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Salvando vídeo...</p>
          </div>
        </div>
      )}

      <AppFooter />

      <CameraModal
        product={cameraProduct}
        isOpen={isCameraOpen}
        onClose={handleCameraClose}
        onSave={handleVideoSave}
      />
    </div>
  )
}