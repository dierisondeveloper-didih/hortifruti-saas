"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, Trash2, Loader2, Tag, FolderOpen } from "lucide-react"

export interface Category {
  id: string
  nome: string
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .eq("dono_id", user.id) // TRAVA DE SEGURANÇA
        .order("nome", { ascending: true })

      if (error) {
        alert("Erro ao carregar categorias: " + error.message)
        setCategories([])
      } else {
        setCategories(
          (data ?? []).map((row) => ({
            id: String(row.id),
            nome: String(row.nome ?? ""),
          }))
        )
      }
    } catch (err) {
      alert("Erro inesperado: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = newCategoryName.trim()
    if (!trimmedName) {
      alert("Digite o nome da categoria")
      return
    }

    setIsAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { error } = await supabase.from("categorias").insert({
        nome: trimmedName,
        dono_id: user.id // TRAVA DE SEGURANÇA
      })

      if (error) {
        alert("Erro ao adicionar categoria: " + error.message)
      } else {
        setNewCategoryName("")
        await fetchCategories()
      }
    } catch (err) {
      alert("Erro inesperado: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a categoria "${categoryName}"?`
    )
    if (!confirmed) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", categoryId)
        .eq("dono_id", user.id) // TRAVA DE SEGURANÇA

      if (error) {
        alert("Erro ao excluir categoria: " + error.message)
      } else {
        await fetchCategories()
      }
    } catch (err) {
      alert("Erro inesperado: " + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <div className="px-4 py-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Tag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">
            Gestao de Categorias
          </h2>
          <p className="text-xs text-muted-foreground">
            Adicione e gerencie as categorias dos produtos
          </p>
        </div>
      </div>

      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="mb-5">
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nome da nova categoria..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={isAdding || !newCategoryName.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Adicionar
          </button>
        </div>
      </form>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Carregando categorias...
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Nenhuma categoria cadastrada
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Adicione sua primeira categoria usando o campo acima
            </p>
          </div>
        </div>
      )}

      {/* Categories List */}
      {!isLoading && categories.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {categories.length}{" "}
            {categories.length === 1 ? "categoria" : "categorias"} cadastradas
          </p>
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {category.nome}
                </span>
              </div>
              <button
                onClick={() => handleDeleteCategory(category.id, category.nome)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20 active:scale-95"
                aria-label={`Excluir categoria ${category.nome}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}