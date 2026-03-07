"use client"

import { Leaf, LogOut, Menu } from "lucide-react"

interface AdminHeaderProps {
  onMenuClick?: () => void
  onLogout?: () => void
}

export function AdminHeader({ onMenuClick, onLogout }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          {/* Hamburger menu button */}
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70 active:scale-95"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">
              Painel Admin
            </h1>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Area do lojista
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/70 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </header>
  )
}
