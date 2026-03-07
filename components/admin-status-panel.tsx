"use client"

import { AlertTriangle, CheckCircle2, Video } from "lucide-react"

interface AdminStatusPanelProps {
  outdatedCount: number
  totalCount: number
}

export function AdminStatusPanel({
  outdatedCount,
  totalCount,
}: AdminStatusPanelProps) {
  const updatedCount = totalCount - outdatedCount
  const allUpdated = outdatedCount === 0

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      {/* Main alert card */}
      <div
        className={`flex items-center gap-3 p-4 rounded-2xl border ${
          allUpdated
            ? "bg-primary/10 border-primary/20"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <div
          className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${
            allUpdated ? "bg-primary/20" : "bg-amber-100"
          }`}
        >
          {allUpdated ? (
            <CheckCircle2 className="w-6 h-6 text-primary" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          )}
        </div>
        <div className="flex flex-col">
          <span
            className={`text-2xl font-bold leading-tight ${
              allUpdated ? "text-primary" : "text-amber-700"
            }`}
          >
            {allUpdated ? "Tudo em dia!" : `${outdatedCount} produto${outdatedCount > 1 ? "s" : ""}`}
          </span>
          <span
            className={`text-sm ${
              allUpdated ? "text-primary/70" : "text-amber-600"
            }`}
          >
            {allUpdated
              ? "Todos os videos estao atualizados"
              : `precisa${outdatedCount > 1 ? "m" : ""} de videos novos hoje`}
          </span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Video className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground leading-tight">
              {updatedCount}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Atualizados
            </span>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground leading-tight">
              {outdatedCount}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Pendentes
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
