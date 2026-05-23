"use client"

import { LogOut, Menu, Volume2, VolumeX } from "lucide-react"
import { Logo } from "./ui/logo"

interface AdminHeaderProps {
  onMenuClick?: () => void
  onLogout?: () => void
  soundEnabled?: boolean
  onToggleSound?: () => void
}

export function AdminHeader({ onMenuClick, onLogout, soundEnabled, onToggleSound }: AdminHeaderProps) {
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

          <div className="flex items-center justify-center w-9 h-9 overflow-hidden">
            <Logo className="w-9 h-9" iconClassName="w-7 h-7" width={36} height={36} />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">
              Painel Admin
            </h1>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Área do lojista
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors active:scale-95 ${
                soundEnabled
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/70"
              }`}
              aria-label={soundEnabled ? "Silenciar som de pedidos" : "Ativar som de pedidos"}
              title={soundEnabled ? "Som de pedidos ativado" : "Som de pedidos silenciado"}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/70 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
