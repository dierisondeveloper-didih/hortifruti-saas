"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  Building2,
  Mail,
  Lock,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Plus,
  Package,
  ShoppingBag,
  Trash2,
  Power,
  PowerOff,
  RefreshCw,
  Wrench,
  ExternalLink,
} from "lucide-react"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface LojaData {
  id: string
  name: string
  slug: string
  ativo: boolean
  created_at: string
  dono_id: string
  config: {
    nome_loja: string
    cor_primaria: string
    telefone_whatsapp: string
  } | null
  produto_count: number
  pedido_count: number
}

type Tab = "lojas" | "novo"

type Feedback = { type: "success" | "error"; text: string } | null

// ─── Helper: busca o token da sessão ─────────────────────────────────────────

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  return session ? `Bearer ${session.access_token}` : ""
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const router = useRouter()

  // Auth
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>("lojas")

  // Lista de lojas
  const [lojas, setLojas] = useState<LojaData[]>([])
  const [isLoadingLojas, setIsLoadingLojas] = useState(false)
  const [lojasFeedback, setLojasFeedback] = useState<Feedback>(null)

  // Ações por loja
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null) // dono_id
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Cleanup
  const [isCleaningUp, setIsCleaningUp] = useState(false)

  // Formulário "Novo Lojista"
  const [formData, setFormData] = useState({
    nomeLoja: "",
    slug: "",
    email: "",
    password: "",
  })
  const [isCreating, setIsCreating] = useState(false)
  const [createFeedback, setCreateFeedback] = useState<Feedback>(null)

  // ── Verificação de autorização ────────────────────────────────────────────

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      try {
        const res = await fetch("/api/super-admin/auth", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json()

        if (!data.authorized) {
          router.push("/login")
          return
        }

        setIsAuthorized(true)
      } catch {
        router.push("/login")
      } finally {
        setIsAuthChecking(false)
      }
    }

    checkAuth()
  }, [router])

  // ── Busca lojas ──────────────────────────────────────────────────────────

  const fetchLojas = useCallback(async () => {
    setIsLoadingLojas(true)
    setLojasFeedback(null)

    try {
      const authHeader = await getAuthHeader()
      const res = await fetch("/api/super-admin/lojas", {
        headers: { Authorization: authHeader },
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Erro ao carregar lojas")
      setLojas(data.lojas)
    } catch (err: any) {
      setLojasFeedback({ type: "error", text: err.message })
    } finally {
      setIsLoadingLojas(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthorized) fetchLojas()
  }, [isAuthorized, fetchLojas])

  // ── Toggle ativo/inativo ──────────────────────────────────────────────────

  async function handleToggleAtivo(loja: LojaData) {
    setTogglingId(loja.id)
    setLojasFeedback(null)

    try {
      const authHeader = await getAuthHeader()
      const res = await fetch("/api/super-admin/lojas", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ lojaId: loja.id, ativo: !loja.ativo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setLojasFeedback({
        type: "success",
        text: `Loja "${loja.config?.nome_loja || loja.name}" ${!loja.ativo ? "ativada" : "desativada"}.`,
      })
      await fetchLojas()
    } catch (err: any) {
      setLojasFeedback({ type: "error", text: err.message })
    } finally {
      setTogglingId(null)
    }
  }

  // ── Excluir loja (dois cliques) ───────────────────────────────────────────

  async function handleDelete(donoId: string, nomeLoja: string) {
    setDeletingId(donoId)
    setLojasFeedback(null)

    try {
      const authHeader = await getAuthHeader()
      const res = await fetch("/api/super-admin/lojas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ donoId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setLojasFeedback({ type: "success", text: `Loja "${nomeLoja}" excluída com sucesso.` })
      setDeleteConfirm(null)
      await fetchLojas()
    } catch (err: any) {
      setLojasFeedback({ type: "error", text: err.message })
    } finally {
      setDeletingId(null)
    }
  }

  // ── Cleanup de órfãos ─────────────────────────────────────────────────────

  async function handleCleanup() {
    setIsCleaningUp(true)
    setLojasFeedback(null)

    try {
      const authHeader = await getAuthHeader()
      const res = await fetch("/api/super-admin/cleanup", {
        method: "POST",
        headers: { Authorization: authHeader },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setLojasFeedback({ type: "success", text: data.message })
      if (data.created > 0) await fetchLojas()
    } catch (err: any) {
      setLojasFeedback({ type: "error", text: err.message })
    } finally {
      setIsCleaningUp(false)
    }
  }

  // ── Criar novo lojista ────────────────────────────────────────────────────

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)
    setCreateFeedback(null)

    const slugFormatado = formData.slug.toLowerCase().replace(/\s+/g, "-")

    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, slug: slugFormatado }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao criar loja")

      setCreateFeedback({
        type: "success",
        text: `Sucesso! A loja "${data.loja.name}" foi criada.`,
      })
      setFormData({ nomeLoja: "", slug: "", email: "", password: "" })

      // Atualiza a lista se o usuário voltar para a tab de lojas
      await fetchLojas()
    } catch (err: any) {
      setCreateFeedback({ type: "error", text: err.message })
    } finally {
      setIsCreating(false)
    }
  }

  // ── Loading de auth ───────────────────────────────────────────────────────

  if (isAuthChecking || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Vértice Digital</h1>
            <p className="text-sm text-muted-foreground">Painel Super Admin</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-secondary rounded-xl p-1">
          <button
            onClick={() => setActiveTab("lojas")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "lojas"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Lojistas
          </button>
          <button
            onClick={() => setActiveTab("novo")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "novo"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="w-4 h-4" />
            Novo Lojista
          </button>
        </div>

        {/* ── TAB: LOJISTAS ─────────────────────────────────────────────── */}
        {activeTab === "lojas" && (
          <div className="space-y-4">

            {/* Ações do topo */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {lojas.length} loja{lojas.length !== 1 ? "s" : ""} cadastrada{lojas.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCleanup}
                  disabled={isCleaningUp}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/70 transition-colors disabled:opacity-50"
                >
                  {isCleaningUp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wrench className="w-3.5 h-3.5" />
                  )}
                  Corrigir dados órfãos
                </button>
                <button
                  onClick={fetchLojas}
                  disabled={isLoadingLojas}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/70 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLojas ? "animate-spin" : ""}`} />
                  Atualizar
                </button>
              </div>
            </div>

            {/* Feedback global */}
            {lojasFeedback && (
              <div
                className={`flex items-start gap-3 p-4 rounded-xl text-sm font-medium ${
                  lojasFeedback.type === "success"
                    ? "bg-green-500/10 text-green-600"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {lojasFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span>{lojasFeedback.text}</span>
              </div>
            )}

            {/* Loading */}
            {isLoadingLojas && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Carregando lojas...</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoadingLojas && lojas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Nenhuma loja cadastrada</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crie a primeira loja na aba &quot;Novo Lojista&quot;
                </p>
              </div>
            )}

            {/* Lista de lojas */}
            {!isLoadingLojas && lojas.length > 0 && (
              <div className="space-y-3">
                {lojas.map((loja) => {
                  const nomeLoja = loja.config?.nome_loja || loja.name
                  const isToggling = togglingId === loja.id
                  const isDeleting = deletingId === loja.dono_id
                  const isConfirming = deleteConfirm === loja.dono_id

                  return (
                    <div
                      key={loja.id}
                      className="bg-card border border-border rounded-2xl p-4 space-y-3"
                    >
                      {/* Linha 1: Nome + status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Bolinha de cor primária */}
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-border"
                            style={{ backgroundColor: loja.config?.cor_primaria || "#2d8a4e" }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {nomeLoja}
                            </p>
                            <a
                              href={`/${loja.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                              /{loja.slug}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            loja.ativo
                              ? "bg-green-500/10 text-green-600"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {loja.ativo ? "Ativa" : "Inativa"}
                        </span>
                      </div>

                      {/* Linha 2: Métricas */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" />
                          {loja.produto_count} produto{loja.produto_count !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {loja.pedido_count} pedido{loja.pedido_count !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Linha 3: Ações */}
                      <div className="flex items-center gap-2 pt-1 border-t border-border">
                        {/* Toggle ativo */}
                        <button
                          onClick={() => handleToggleAtivo(loja)}
                          disabled={isToggling || isDeleting}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50 ${
                            loja.ativo
                              ? "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
                              : "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : loja.ativo ? (
                            <PowerOff className="w-3.5 h-3.5" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                          {loja.ativo ? "Desativar" : "Ativar"}
                        </button>

                        {/* Excluir — dois passos */}
                        {!isConfirming ? (
                          <button
                            onClick={() => setDeleteConfirm(loja.dono_id)}
                            disabled={isDeleting || isToggling}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-all disabled:opacity-50 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-xs font-medium text-destructive">Tem certeza?</span>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/70 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleDelete(loja.dono_id, nomeLoja)}
                              disabled={isDeleting}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive text-white text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-70"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              Confirmar exclusão
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: NOVO LOJISTA ─────────────────────────────────────────── */}
        {activeTab === "novo" && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Criar Nova Loja</h2>
                <p className="text-xs text-muted-foreground">
                  Cria o usuário e a loja em uma única operação
                </p>
              </div>
            </div>

            {createFeedback && (
              <div
                className={`flex items-start gap-3 p-4 rounded-xl mb-5 text-sm font-medium ${
                  createFeedback.type === "success"
                    ? "bg-green-500/10 text-green-600"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {createFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span>{createFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nome da Loja</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={formData.nomeLoja}
                    onChange={(e) => setFormData({ ...formData, nomeLoja: e.target.value })}
                    placeholder="Ex: Hortifruti do Zé"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Link da Loja (Slug)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Ex: hortifruti-do-ze"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">E-mail do Lojista</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@loja.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {isCreating ? "Criando..." : "Criar Novo Cliente"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
