"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Mail, Lock, Loader2, Eye, EyeOff, Check } from "lucide-react"
import Link from "next/link"
import { AppFooter } from "@/components/app-footer"
import { Logo } from "@/components/ui/logo"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError("Por favor, preencha todos os campos.")
      return
    }

    setIsLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("E-mail ou senha incorretos.")
        } else {
          setError(authError.message)
        }
        setIsLoading(false)
        return
      }

      // Preferência "manter-me conectado": se desmarcado, marca para que
      // a sessão seja descartada ao fechar (limpa no próximo carregamento
      // sem essa flag). Por padrão (marcado) a sessão persiste normalmente.
      if (rememberMe) {
        localStorage.setItem("manter_login", "true")
      } else {
        localStorage.removeItem("manter_login")
      }

      // Verifica se é super admin antes de redirecionar
      const { data: { session } } = await supabase.auth.getSession()
      let destination = "/admin"

      if (session?.access_token) {
        try {
          const res = await fetch("/api/super-admin/auth", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          const data = await res.json()
          if (data.authorized) destination = "/super-admin"
        } catch {
          // Falha silenciosa — mantém /admin como destino
        }
      }

      router.push(destination)
    } catch (err) {
      setError(
        "Erro inesperado: " +
          (err instanceof Error ? err.message : String(err))
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-0">
      <style>{`
        @keyframes login-float {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        .login-icon-float { animation: login-float 3.5s ease-in-out infinite; }
      `}</style>
      <div className="w-full max-w-sm flex-1 flex flex-col justify-center">
        {/* Logo and title */}
        <div className="flex flex-col items-center mb-8">
          <div className="login-icon-float mb-4">
            <Logo className="w-24 h-24" iconClassName="w-12 h-12" width={96} height={96} priority />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acesse sua conta para gerenciar a loja
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label
              htmlFor="email"
              className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"
            >
              <Mail className="w-4 h-4 text-muted-foreground" />
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
          </div>

          {/* Password field */}
          <div>
            <label
              htmlFor="password"
              className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"
            >
              <Lock className="w-4 h-4 text-muted-foreground" />
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Manter login */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={rememberMe}
              onClick={() => setRememberMe((v) => !v)}
              className={`flex items-center justify-center w-5 h-5 rounded-md border transition-colors shrink-0 ${
                rememberMe
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-input"
              }`}
            >
              {rememberMe && <Check className="w-3.5 h-3.5" />}
            </button>
            <span className="text-sm text-muted-foreground">Manter-me conectado</span>
          </label>

          {/* Error message */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        {/* Back to store link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
      <AppFooter />
    </div>
  )
}
