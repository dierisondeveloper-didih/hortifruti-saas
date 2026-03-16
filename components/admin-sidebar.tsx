"use client"

import { useEffect, useCallback } from "react"
import {
  X,
  Video,
  Package,
  Tags,
  Users,
  Settings,
  Leaf,
  LayoutDashboard,
} from "lucide-react"

export type AdminTab =
  | "dashboard"
  | "videos"
  | "products"
  | "categories"
  | "customers"
  | "settings"

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
}

const menuItems: { id: AdminTab; label: string; icon: typeof Video }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "videos", label: "Atualizacao de Videos", icon: Video },
  { id: "products", label: "Gestao de Produtos", icon: Package },
  { id: "categories", label: "Categorias", icon: Tags },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "settings", label: "Configuracoes", icon: Settings },
]

export function AdminSidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
}: AdminSidebarProps) {
  // Close on escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl animate-in slide-in-from-left duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegacao"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground leading-tight">
                Hortifruti Online
              </h2>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Painel Administrativo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70 active:scale-95"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3">
          <ul className="flex flex-col gap-1" role="list">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onTabChange(item.id)
                      onClose()
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all active:scale-[0.98] ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground text-center">
            Versao 1.0 - Hortifruti Online
          </p>
        </div>
      </aside>
    </div>
  )
}
