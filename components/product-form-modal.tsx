"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Package } from "lucide-react"

export interface ProductFormData {
  id?: string
  nome: string
  preco: number
  unidade: string
  estoque: number
  categoria: string
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
        className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/70 active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
