"use client"

import Image from "next/image"
import { Video, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react"

export interface AdminProduct {
  id: string
  name: string
  image: string
  price: number
  unit: string
  videoStatus: "updated" | "outdated" | "old"
  videoTimestamp: string
  videoUrl?: string
}

interface AdminProductListProps {
  products: AdminProduct[]
  onRecordClick: (product: AdminProduct) => void
  onDeleteVideo: (product: AdminProduct) => void
}

function getStatusConfig(status: AdminProduct["videoStatus"]) {
  switch (status) {
    case "updated":
      return {
        label: "Atualizado hoje",
        bgClass: "bg-primary/10",
        textClass: "text-primary",
        borderClass: "border-primary/20",
        icon: CheckCircle2,
      }
    case "outdated":
      return {
        label: "Video antigo",
        bgClass: "bg-amber-50",
        textClass: "text-amber-700",
        borderClass: "border-amber-200",
        icon: AlertTriangle,
      }
    case "old":
      return {
        label: "Sem video",
        bgClass: "bg-red-50",
        textClass: "text-red-600",
        borderClass: "border-red-200",
        icon: AlertTriangle,
      }
  }
}

export function AdminProductList({
  products,
  onRecordClick,
  onDeleteVideo,
}: AdminProductListProps) {
  return (
    <div className="px-4 pb-6">
      <h2 className="text-sm font-semibold text-foreground mb-3">
        Seus produtos
      </h2>
      <ul className="flex flex-col gap-3" role="list">
        {products.map((product) => {
          const statusCfg = getStatusConfig(product.videoStatus)
          const StatusIcon = statusCfg.icon

          return (
            <li
              key={product.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border"
            >
              {/* Thumbnail */}
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 min-w-0 gap-1">
                <span className="text-sm font-semibold text-foreground truncate">
                  {product.name}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    R${" "}
                    {product.price.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    /{product.unit}
                  </span>
                </div>

                {/* Status badge */}
                <div
                  className={`flex items-center gap-1 self-start px-2 py-0.5 rounded-md border text-[11px] font-medium ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  <span>{statusCfg.label}</span>
                  <span className="opacity-70">
                    {product.videoStatus !== "updated" &&
                      `(${product.videoTimestamp})`}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {product.videoUrl && (
                  <button
                    onClick={() => onDeleteVideo(product)}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200 transition-all hover:bg-red-100 active:scale-95"
                    aria-label={`Excluir video de ${product.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onRecordClick(product)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold transition-all hover:brightness-110 active:scale-95"
                  aria-label={`Gravar video de atualizacao para ${product.name}`}
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden min-[400px]:inline">Gravar</span>
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
