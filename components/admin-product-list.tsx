"use client"

import { useState } from "react"
import { ProductImage } from "./product-image"
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
  const [deleteConfirm, setDeleteConfirm] = useState<AdminProduct | null>(null)

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDeleteVideo(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

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
                <ProductImage
                  src={product.image}
                  name={product.name}
                  sizes="56px"
                  compact
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
                    onClick={() => setDeleteConfirm(product)}
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
                  Excluir vídeo?
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  O vídeo de "{deleteConfirm.name}" será removido.
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
