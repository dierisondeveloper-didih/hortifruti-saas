"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Package, ImagePlus, Loader2, Upload, Camera } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

// Conectando com o seu banco Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface ProductFormData {
  id?: string
  nome: string
  preco: number
  unidade: string
  estoque: number
  categoria: string
  imagem_url?: string // Nova coluna adicionada aqui!
}

export interface CategoryOption {
  id: string
  nome: string
}

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProductFormData) => void
  initialData?: ProductFormData | null
  mode: "add" | "edit"
  categories?: CategoryOption[]
}

const defaultData: ProductFormData = {
  nome: "",
  preco: 0,
  unidade: "kg",
  estoque: 0,
  categoria: "frutas",
  imagem_url: "",
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
  categories = [],
}: ProductFormModalProps) {
  const [formData, setFormData] = useState<ProductFormData>(defaultData)
  const [isUploading, setIsUploading] = useState(false) // Estado para controlar o carregamento da imagem

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData ?? defaultData)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen, initialData])

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, handleEscape])

  // Função mágica que faz o upload para o Supabase
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setIsUploading(true)

      // Criar um nome único para o arquivo (evita que uma foto de maçã sobrescreva outra)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      
      // Fazer upload para o bucket 'produtos'
      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Pegar a URL pública da imagem que acabou de subir
      const { data } = supabase.storage
        .from('produtos')
        .getPublicUrl(fileName)

      // Salvar a URL no estado do formulário
      setFormData((prev) => ({ ...prev, imagem_url: data.publicUrl }))

    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error)
      alert("Erro ao enviar a imagem. Tente novamente.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h2 id="modal-title" className="text-base font-bold text-foreground">
              {mode === "add" ? "Adicionar Produto" : "Editar Produto"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70 active:scale-95"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          
          {/* Foto do Produto */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Foto do Produto
            </label>

            {/* Preview */}
            <div className="flex justify-center">
              <div className="relative w-28 h-28 rounded-xl border border-dashed border-input bg-background overflow-hidden">
                {formData.imagem_url ? (
                  <>
                    <img src={formData.imagem_url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imagem_url: "" }))}
                      className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      aria-label="Remover imagem"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImagePlus className="w-7 h-7 text-muted-foreground" />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </div>

            {/* Botões de upload */}
            <div className="flex gap-2">
              <input
                type="file"
                id="imagem-galeria"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
              />
              <input
                type="file"
                id="imagem-camera"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
              />
              <label
                htmlFor="imagem-galeria"
                className={`flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/70 active:scale-95 ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <Upload className="w-4 h-4" />
                Enviar Imagem
              </label>
              <label
                htmlFor="imagem-camera"
                className={`flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/70 active:scale-95 ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <Camera className="w-4 h-4" />
                Tirar Foto
              </label>
            </div>
          </div>

          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nome" className="text-sm font-medium text-foreground">
              Nome do Produto
            </label>
            <input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nome: e.target.value }))
              }
              placeholder="Ex: Tomate Carmem"
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Preco and Unidade */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <label htmlFor="preco" className="text-sm font-medium text-foreground">
                Preco (R$)
              </label>
              <input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    preco: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0,00"
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div className="w-24 flex flex-col gap-1.5">
              <label htmlFor="unidade" className="text-sm font-medium text-foreground">
                Unidade
              </label>
              <select
                id="unidade"
                value={formData.unidade}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, unidade: e.target.value }))
                }
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="kg">kg</option>
                <option value="un">un</option>
                <option value="maco">maco</option>
                <option value="bandeja">bandeja</option>
              </select>
            </div>
          </div>

          {/* Estoque */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="estoque" className="text-sm font-medium text-foreground">
              Estoque
            </label>
            <input
              id="estoque"
              type="number"
              min="0"
              value={formData.estoque || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estoque: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="categoria" className="text-sm font-medium text-foreground">
              Categoria
            </label>
            <select
              id="categoria"
              value={formData.categoria}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, categoria: e.target.value }))
              }
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {categories.length === 0 ? (
                <option value="">Nenhuma categoria cadastrada</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.nome.toLowerCase()}>
                    {cat.nome}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/70 active:scale-95 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isUploading ? 'Carregando foto...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}