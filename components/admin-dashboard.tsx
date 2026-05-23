"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Package,
  ShoppingBag,
  Clock,
  VideoOff,
  ExternalLink,
  Copy,
  CheckCheck,
  Loader2,
  TrendingUp,
  Calendar,
  Share2,
  QrCode,
  ChevronRight,
  Download,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

interface SalesData {
  name: string
  total: number
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

interface DashboardData {
  nomeLoja: string
  slug: string
  totalProdutos: number
  produtosDoLojista: number
  totalPedidos: number
  pedidosPendentes: number
  videosDesatualizados: number
  faturamentoTotal: number
  chartData: SalesData[]
  topProducts: TopProduct[]
}

interface AdminDashboardProps {
  onNavigate?: (tab: "dashboard" | "videos" | "products") => void
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [downloadingQR, setDownloadingQR] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)
  const [hasShared, setHasShared] = useState(false)

  useEffect(() => {
    setHasShared(localStorage.getItem("loja_compartilhada") === "true")
  }, [])

  const markAsShared = () => {
    localStorage.setItem("loja_compartilhada", "true")
    setHasShared(true)
  }

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const donoId = user.id
        const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        const [configRes, lojaRes, produtosRes, pedidosRes, videosRes, produtosLojistaRes] =
          await Promise.all([
            supabase
              .from("configuracoes")
              .select("nome_loja")
              .eq("dono_id", donoId)
              .order("id", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase.from("lojas").select("slug").eq("dono_id", donoId).maybeSingle(),
            supabase
              .from("produtos")
              .select("*", { count: "exact", head: true })
              .eq("dono_id", donoId),
            supabase
              .from("pedidos")
              .select("total, status, created_at, itens")
              .eq("dono_id", donoId)
              .gte("created_at", cutoff7d),
            supabase
              .from("produtos")
              .select("*", { count: "exact", head: true })
              .eq("dono_id", donoId)
              .or(`ultimo_video_em.is.null,ultimo_video_em.lt.${cutoff24h}`),
            supabase
              .from("produtos")
              .select("*", { count: "exact", head: true })
              .eq("dono_id", donoId)
              .eq("criado_automaticamente", false),
          ])

        // Processamento de dados para o gráfico
        const orders = pedidosRes.data || []
        const faturamentoTotal = orders.reduce((acc, curr) => acc + (curr.total || 0), 0)
        const pendentes = orders.filter(o => o.status?.toLowerCase() === "pendente").length

        // Agrupamento por dia (últimos 7 dias)
        const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return {
            name: days[date.getDay()],
            fullDate: date.toISOString().split("T")[0],
            total: 0
          }
        })

        const topProductsMap = new Map<string, { quantity: number; revenue: number }>()

        orders.forEach(order => {
          const orderDate = new Date(order.created_at).toISOString().split("T")[0]
          const dayMatch = last7Days.find(d => d.fullDate === orderDate)
          if (dayMatch) {
            dayMatch.total += order.total || 0
          }

          if (order.itens && Array.isArray(order.itens)) {
            order.itens.forEach((item: any) => {
              const current = topProductsMap.get(item.product_name) || { quantity: 0, revenue: 0 }
              topProductsMap.set(item.product_name, {
                quantity: current.quantity + item.quantity,
                revenue: current.revenue + (item.quantity * item.unit_price)
              })
            })
          }
        })

        const topProducts = Array.from(topProductsMap.entries())
          .map(([name, pdata]) => ({ name, ...pdata }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)

        setData({
          nomeLoja: configRes.data?.nome_loja || "Minha Loja",
          slug: lojaRes.data?.slug || "",
          totalProdutos: produtosRes.count ?? 0,
          produtosDoLojista: produtosLojistaRes.count ?? 0,
          totalPedidos: orders.length,
          pedidosPendentes: pendentes,
          videosDesatualizados: videosRes.count ?? 0,
          faturamentoTotal,
          chartData: last7Days.map(({ name, total }) => ({ name, total })),
          topProducts
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const storeUrl = data
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${data.slug}`
    : ""

  const handleCopy = async () => {
    await navigator.clipboard.writeText(storeUrl)
    setCopied(true)
    markAsShared()
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = async () => {
    if (!storeUrl) return
    setDownloadingQR(true)
    try {
      // 512px = boa resolução para impressão
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=16&data=${encodeURIComponent(storeUrl)}`
      const res = await fetch(qrUrl)
      if (!res.ok) throw new Error("Falha ao gerar QR")
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objectUrl
      const slug = data?.slug ? data.slug : "loja"
      a.download = `qrcode-${slug}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch {
      toast.error("Não foi possível baixar o QR code. Tente novamente.")
    } finally {
      setDownloadingQR(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Gerando inteligência de negócio...</p>
      </div>
    )
  }

  if (!data) return null

  // Onboarding: mostra primeiros passos enquanto a loja não decolou
  const hasProducts = data.produtosDoLojista > 0
  const hasVideos = data.totalProdutos > 0 && data.videosDesatualizados < data.totalProdutos
  const hasOrders = data.totalPedidos > 0
  const hasSharedStore = hasShared || hasOrders
  const allDone = hasProducts && hasVideos && hasSharedStore
  const showOnboarding = !allDone

  const onboardingSteps = [
    {
      done: hasProducts,
      title: "Cadastre seus produtos",
      desc: "Monte seu catálogo com preços e fotos.",
      icon: Package,
      target: "products" as const,
    },
    {
      done: hasVideos,
      title: "Grave os vídeos ao vivo",
      desc: "Mostre o frescor dos seus produtos em vídeo.",
      icon: VideoOff,
      target: "videos" as const,
    },
    {
      done: hasSharedStore,
      title: "Compartilhe sua loja",
      desc: "Envie seu link pelo WhatsApp e receba pedidos.",
      icon: ExternalLink,
      target: "share" as const,
    },
  ]
  const completedSteps = onboardingSteps.filter((s) => s.done).length

  const metrics = [
    {
      label: "Faturamento (7d)",
      value: `R$ ${data.faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Pedidos (7d)",
      value: data.totalPedidos,
      icon: ShoppingBag,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Pendentes",
      value: data.pedidosPendentes,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Produtos",
      value: data.totalProdutos,
      icon: Package,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
  ]

  return (
    <div className="px-4 py-5 space-y-6">
      {/* Saudação com visual premium */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Olá, {data.nomeLoja.split(" ")[0]}!</h2>
          <p className="text-sm text-muted-foreground">Aqui está o desempenho da sua loja.</p>
        </div>
      </div>

      {/* Onboarding — primeiros passos (some quando a loja decola) */}
      {showOnboarding && (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Primeiros passos</h3>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {completedSteps}/3 concluídos
            </span>
          </div>

          <div className="space-y-2.5">
            {onboardingSteps.map((step, i) => {
              const Icon = step.icon
              const handleStepClick = () => {
                if (step.done) return
                if (step.target === "share") {
                  shareRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                } else {
                  onNavigate?.(step.target)
                }
              }
              return (
                <button
                  key={i}
                  onClick={handleStepClick}
                  disabled={step.done}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    step.done
                      ? "bg-primary/5 border-primary/10 opacity-60 cursor-default"
                      : "bg-card border-border hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      step.done ? "bg-primary/15" : "bg-secondary"
                    }`}
                  >
                    {step.done ? (
                      <CheckCheck className="w-4 h-4 text-primary" />
                    ) : (
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                  {!step.done && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Métricas em Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div
              key={metric.label}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 flex flex-col gap-2 shadow-sm"
            >
              <div className={`w-8 h-8 rounded-xl ${metric.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${metric.color}`} />
              </div>
              <div>
                <p className="text-xl font-black text-foreground">{metric.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{metric.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Gráfico de Vendas Premium */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Vendas na Semana</h3>
          </div>
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">Últimos 7 dias</span>
        </div>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "oklch(0.85 0.02 150 / 0.12)" : "oklch(0.50 0.02 150 / 0.1)"} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: isDark ? 'oklch(0.75 0.02 150)' : 'oklch(0.50 0.02 150)' }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? 'oklch(0.22 0.02 150 / 0.95)' : 'oklch(1 0 0 / 0.9)', 
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  border: isDark ? '1px solid oklch(0.85 0.02 150 / 0.15)' : '1px solid oklch(0.50 0.02 150 / 0.1)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px oklch(0 0 0 / 0.15)'
                }}
                itemStyle={{ color: 'var(--primary)' }}
                labelStyle={{ color: isDark ? 'oklch(0.92 0.01 150)' : 'oklch(0.20 0.02 150)' }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="var(--primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Produtos */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Top 5 Produtos (7d)</h3>
          </div>
        </div>
        <div className="space-y-3">
          {data.topProducts.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground line-clamp-1">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.quantity} vendidos</span>
              </div>
              <span className="text-sm font-bold text-primary">
                R$ {p.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          {data.topProducts.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">Nenhum dado de venda na semana.</p>
          )}
        </div>
      </div>

      {/* Link público da loja - Reestilizado */}
      <div ref={shareRef} className="bg-primary/5 border border-primary/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-primary uppercase tracking-widest">
            Sua vitrine online
          </p>
          <ExternalLink className="w-4 h-4 text-primary/40" />
        </div>
        <div className="bg-background/50 rounded-xl px-4 py-3 border border-primary/5">
          <p className="text-sm font-mono text-foreground/70 truncate">{storeUrl}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-card border border-border shadow-sm text-sm font-bold transition-all hover:bg-secondary active:scale-95"
          >
            {copied ? (
              <CheckCheck className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
            {copied ? "Copiado!" : "Copiar"}
          </button>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 text-sm font-bold transition-all hover:brightness-110 active:scale-95"
          >
            Acessar
          </a>
        </div>

        {/* Compartilhar no WhatsApp + QR code */}
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Confira nossa loja online: ${storeUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={markAsShared}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] text-white shadow-sm text-sm font-bold transition-all hover:brightness-110 active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar no WhatsApp
          </a>
          <button
            onClick={() => setShowQR((v) => !v)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-card border border-border shadow-sm text-sm font-bold transition-all hover:bg-secondary active:scale-95"
            aria-label="Mostrar QR code"
          >
            <QrCode className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {showQR && storeUrl && (
          <div className="flex flex-col items-center gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-white p-3 rounded-2xl shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(storeUrl)}`}
                alt="QR code da loja"
                width={180}
                height={180}
                className="rounded-lg"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-[220px]">
              Imprima e cole no balcão para os clientes acessarem sua loja pelo celular.
            </p>
            <button
              onClick={handleDownloadQR}
              disabled={downloadingQR}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {downloadingQR ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloadingQR ? "Preparando..." : "Baixar QR code"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
