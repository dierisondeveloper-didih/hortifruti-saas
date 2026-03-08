"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Plus, Pencil, Trash2, Package } from "lucide-react"
import {
  ProductFormModal,
  type ProductFormData,
  type CategoryOption,
} from "@/components/product-form-modal"
import { getProductImage } from "@/lib/product-utils"
import { supabase } from "@/lib/supabase"

export interface ManagedProduct {
  id: string
  name: string
  price: number
  unit: string
  stock: number
  category: string
  image: string
}

interface ProductManagementProps {
  products: ManagedProduct[]
  isLoading: boolean
  onAddProduct: (data: ProductFormData) => void
  onEditProduct: (data: ProductFormData) => void
  onDeleteProduct: (productId: string) => void
}

export function ProductManagement({
  products,
  isLoading,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: ProductManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(
    null
  )
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])

  // Fetch categories from database
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nome", { ascending: true })

      if (!error && data) {
        setCategories(
          data.map((row) => ({
            id: String(row.id),
            nome: String(row.nome ?? ""),
          }))
        )
      }
    } catch {
      // Silently fail - categories will be empty
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleAddClick = () => {
    setModalMode("add")
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (product: ManagedProduct) => {
    setModalMode("edit")
    setEditingProduct({
      id: product.id,
      nome: product.name,
      preco: product.price,
      unidade: product.unit,
      estoque: product.stock,
      categoria: product.category,
      imagem_url: product.image, // <--- AQUI ESTÁ A MÁGICA ADICIONADA!
    })
    setIsModalOpen(true)
  }

  const handleDeleteClick = (productId: string) => {
    setDeleteConfirm(productId)
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDeleteProduct(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  const handleSave = (data: ProductFormData) => {
    if (modalMode === "add") {
      onAddProduct(data)
    } else {
      onEditProduct(data)
    }
    setIsModalOpen(false)
  }

  return (
    <div className="px-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Gestao de Produtos
          </h2>
          <p className="text-xs text-muted-foreground">
            {products.length} produto{products.length !== 1 ? "s" : ""} cadastrado
            {products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Package className="w-8 h-8 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Carregando produtos...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Nenhum produto cadastrado
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique em &quot;Adicionar&quot; para cadastrar seu primeiro produto
            </p>
          </div>
        </div>
      )}

      {/* Product list */}
      {!isLoading && products.length > 0 && (
        <ul className="flex flex-col gap-2" role="list">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border"
            >
              {/* Thumbnail */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted">
                <Image
                  src={product.image || "https://images.unsplash.com/photo-1610397962076-02407a169a5b?q=80&w=200&auto=format&fit=crop"} // Garantia de não quebrar
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground truncate">
                  {product.name}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    R${" "}
                    {product.price.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    /{product.unit}
                  </span>
                  <span>-</span>
                  <span>
                    {product.stock} {product.unit}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground/70 capitalize">
                  {product.category}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleEditClick(product)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70 active:scale-95"
                  aria-label={`Editar ${product.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(product.id)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20 active:scale-95"
                  aria-label={`Excluir ${product.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add/Edit Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingProduct}
        mode={modalMode}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setDeleteConfirm(null)}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl p-5 animate-in zoom-in-95 fade-in duration-200"
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Excluir produto?
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta acao nao pode ser desfeita.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/70 active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}