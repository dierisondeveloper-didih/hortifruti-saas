import Link from "next/link"
import { Building2, Store, LogIn } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col items-center text-center gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vértice Digital</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Plataforma de Catálogos Online para Hortifrutis
            </p>
          </div>
        </div>

        {/* Seção clientes finais */}
        <div className="w-full bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <Store className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Procurando uma loja? Solicite o link do catálogo diretamente ao seu lojista.
          </p>
        </div>

        {/* Seção lojistas */}
        <div className="w-full flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Área do Lojista
          </p>
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <LogIn className="w-4 h-4" />
            Acessar Painel Admin
          </Link>
        </div>

      </div>
    </div>
  )
}
