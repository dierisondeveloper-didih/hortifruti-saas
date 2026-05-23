"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Store, LogIn, Video, Zap, TrendingUp, ArrowRight, Link as LinkIcon, History, X } from "lucide-react"
import { AppFooter } from "@/components/app-footer"
import { Logo } from "@/components/ui/logo"
import { ThemeToggle } from "@/components/theme-toggle"

const features = [
  { icon: Video, label: "Vídeo ao vivo" },
  { icon: Zap, label: "Pedido rápido" },
  { icon: TrendingUp, label: "Mais vendas" },
]

export default function Home() {
  const router = useRouter()
  const [storeLink, setStoreLink] = useState("")
  const [recentStores, setRecentStores] = useState<string[]>([])
  
  // Lead capture state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [leadForm, setLeadForm] = useState({ nome_responsavel: "", nome_loja: "", telefone_whatsapp: "" })
  const [isSubmittingLead, setIsSubmittingLead] = useState(false)
  const [leadSuccess, setLeadSuccess] = useState(false)

  // Carrega histórico do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recent_stores")
    if (saved) {
      try {
        setRecentStores(JSON.parse(saved))
      } catch {
        setRecentStores([])
      }
    }
  }, [])

  const saveToHistory = (slug: string) => {
    const newHistory = [slug, ...recentStores.filter(s => s !== slug)].slice(0, 5)
    setRecentStores(newHistory)
    localStorage.setItem("recent_stores", JSON.stringify(newHistory))
  }

  const handleAccessStore = (e?: React.FormEvent, manualSlug?: string) => {
    if (e) e.preventDefault()
    
    let slug = manualSlug || storeLink.trim()
    if (!slug) return

    // Tenta extrair o slug se for uma URL completa
    try {
      if (slug.includes("/") && !slug.startsWith("/")) {
        const url = new URL(slug.startsWith("http") ? slug : `https://${slug}`)
        slug = url.pathname.split("/").filter(Boolean)[0] || ""
      } else if (slug.startsWith("/")) {
        slug = slug.split("/").filter(Boolean)[0] || ""
      }
    } catch {
      // Mantém o que foi digitado
    }

    if (slug) {
      saveToHistory(slug)
      router.push(`/${slug}`)
    }
  }

  const removeStoreFromHistory = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation()
    const newHistory = recentStores.filter(s => s !== slug)
    setRecentStores(newHistory)
    localStorage.setItem("recent_stores", JSON.stringify(newHistory))
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingLead(true)
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadForm),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erro desconhecido no servidor")
      }
      setLeadSuccess(true)
    } catch (err: any) {
      alert("Erro ao enviar solicitação: " + err.message)
    } finally {
      setIsSubmittingLead(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-fade-up {
          opacity: 0;
          animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .lp-icon-float {
          animation: float 3.5s ease-in-out infinite;
        }
        .lp-btn {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          box-shadow: 0 4px 18px oklch(0.55 0.17 150 / 0.38);
        }
        .lp-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 28px oklch(0.55 0.17 150 / 0.55);
        }
        .lp-btn:active {
          transform: scale(0.98);
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-background"
      >
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Mesh blobs de fundo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.16 145 / 0.22), transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-32 -right-28 w-80 h-80 rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(0.86 0.12 80 / 0.18), transparent 70%)",
            }}
          />
          <div
            className="absolute top-1/3 -right-48 w-[30rem] h-[30rem] rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(0.70 0.18 148 / 0.10), transparent 70%)",
            }}
          />
        </div>

        {/* Conteúdo principal */}
        <div className="w-full max-w-md flex flex-col items-center text-center gap-6 relative z-10">

          {/* Ícone folha flutuante */}
          <div className="lp-fade-up" style={{ animationDelay: "0ms" }}>
            <div className="lp-icon-float">
              <Logo className="w-28 h-28" iconClassName="w-16 h-16" width={112} height={112} priority />
            </div>
          </div>

          {/* Título + subtítulo */}
          <div className="flex flex-col items-center gap-4">
            <h1
              className="lp-fade-up text-4xl md:text-5xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-br from-emerald-700 to-primary dark:from-emerald-300 dark:to-emerald-500"
              style={{
                animationDelay: "100ms",
              }}
            >
              Venda mais com o frescor do campo
            </h1>
            <p
              className="lp-fade-up text-base md:text-lg font-medium max-w-sm mx-auto text-muted-foreground"
              style={{
                animationDelay: "200ms",
              }}
            >
              A primeira plataforma de catálogos online focada em Hortifrutis com vídeos ao vivo.
            </p>
          </div>

          {/* CTA Principal para Lojista + argumento de venda */}
          <div
            className="lp-fade-up w-full flex flex-col items-center gap-4"
            style={{ animationDelay: "300ms" }}
          >
            <button
              onClick={() => setIsLeadModalOpen(true)}
              className="lp-btn w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-base font-black text-white"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.58 0.18 148), oklch(0.46 0.16 152))",
              }}
            >
              <Zap className="w-5 h-5 fill-current" />
              Solicitar Acesso
            </button>

            {/* Mini-cards de features — reforço logo abaixo do CTA */}
            <div className="w-full grid grid-cols-3 gap-2.5">
              {features.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl bg-white/60 dark:bg-card/60 backdrop-blur-md border border-white/55 dark:border-border/50 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-secondary">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[11px] font-semibold leading-tight text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mt-1"
            >
              <LogIn className="w-4 h-4" />
              Já é nosso cliente? Acessar área do lojista
            </Link>
          </div>

          {/* Divisor sutil separando lojista (acima) de cliente (abaixo) */}
          <div
            className="lp-fade-up w-full flex items-center gap-3 px-2"
            style={{ animationDelay: "400ms" }}
          >
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-medium text-muted-foreground/70 shrink-0">
              é cliente de um Hortifruti?
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Card Acesso Rápido para Clientes — secundário */}
          <div
            className="lp-fade-up w-full rounded-2xl p-5 flex flex-col gap-4 text-left bg-white/65 dark:bg-card/65 backdrop-blur-md border border-white/60 dark:border-border/50 shadow-sm"
            style={{
              animationDelay: "500ms",
              boxShadow: "0 2px 24px oklch(0.55 0.17 150 / 0.1)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-secondary">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Procurando seu Hortifruti?</h3>
                <p className="text-xs text-muted-foreground">Acesse o catálogo da loja ou solicite o link ao seu lojista</p>
              </div>
            </div>

            <form onSubmit={handleAccessStore} className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <LinkIcon className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Cole o link ou digite o nome da loja..."
                value={storeLink}
                onChange={(e) => setStoreLink(e.target.value)}
                className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-white/50 dark:bg-black/20 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-muted-foreground/60"
              />
              <button
                type="submit"
                disabled={!storeLink.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center transition-all hover:brightness-110 active:scale-90 disabled:opacity-0 disabled:scale-75"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 relative z-10">
          <AppFooter />
        </div>
      </div>

      {/* Modal Lead Capture */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-xl p-6 relative">
            <button
              onClick={() => setIsLeadModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {leadSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Solicitação Enviada!</h3>
                <p className="text-sm text-muted-foreground">
                  Nossa equipe entrará em contato em breve pelo WhatsApp para configurar a sua loja.
                </p>
                <button
                  onClick={() => setIsLeadModalOpen(false)}
                  className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all"
                >
                  Entendi
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground">Aumente suas vendas</h3>
                  <p className="text-sm text-muted-foreground mt-1">Preencha os dados e entramos em contato para ativar sua loja.</p>
                </div>
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Seu Nome</label>
                    <input
                      required
                      type="text"
                      placeholder="João da Silva"
                      value={leadForm.nome_responsavel}
                      onChange={(e) => setLeadForm({ ...leadForm, nome_responsavel: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Nome da Loja</label>
                    <input
                      required
                      type="text"
                      placeholder="Hortifruti do João"
                      value={leadForm.nome_loja}
                      onChange={(e) => setLeadForm({ ...leadForm, nome_loja: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">WhatsApp</label>
                    <input
                      required
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={leadForm.telefone_whatsapp}
                      onChange={(e) => setLeadForm({ ...leadForm, telefone_whatsapp: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingLead}
                    className="w-full py-3.5 mt-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingLead ? "Enviando..." : "Solicitar Acesso"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
