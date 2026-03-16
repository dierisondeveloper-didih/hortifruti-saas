"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
  Package,
  ShoppingBag,
  Clock,
  VideoOff,
  ExternalLink,
  Copy,
  CheckCheck,
  Loader2,
} from "lucide-react"

interface DashboardData {
  nomeLoja: string
  slug: string
  totalProdutos: number
  totalPedidos: number
  pedidosPendentes: number
  videosDesatualizados: number
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const donoId = user.id
        const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const [configRes, lojaRes, produtosRes, pedidosTotalRes, pedidosPendentesRes, videosRes] =
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
              .select("*", { count: "exact", head: true })
              .eq("dono_id", donoId),
            supabase
              .from("pedidos")
              .select("*", { count: "exact", head: true })
              .eq("dono_id", donoId)
              .eq("status", "Pendente"),
            supabase
              .from("produtos")
              .select("*", { count: "exact", head: true })
              .eq("dono_id", donoId)
              .or(`ultimo_video_em.is.null,ultimo_video_em.lt.${cutoff24h}`),
          ])

        setData({
          nomeLoja: configRes.data?.nome_loja || "Minha Loja",
          slug: lojaRes.data?.slug || "",
          totalProdutos: produtosRes.count ?? 0,
          totalPedidos: pedidosTotalRes.count ?? 0,
          pedidosPendentes: pedidosPendentesRes.count ?? 0,
          videosDesatualizados: videosRes.count ?? 0,
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
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  if (!data) return null

  const metrics = [
    {
      label: "Produtos cadastrados",
      value: data.totalProdutos,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Pedidos recebidos",
      value: data.totalPedidos,
      icon: ShoppingBag,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Pedidos pendentes",
      value: data.pedidosPendentes,
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Vídeos desatualizados",
      value: data.videosDesatualizados,
      icon: VideoOff,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
  ]

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Saudação */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Olá, {data.nomeLoja}!</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Bem-vindo ao seu painel.</p>
      </div>

      {/* Link público da loja */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Link público da loja
        </p>
        <p className="text-sm font-medium text-foreground truncate">{storeUrl}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/70 transition-colors active:scale-95"
          >
            {copied ? (
              <CheckCheck className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copiado!" : "Copiar Link"}
          </button>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            Acessar Loja
          </a>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div
              key={metric.label}
              className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
            >
              <div className={`w-9 h-9 rounded-lg ${metric.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{metric.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
