import { useState, useEffect } from "react"

interface AppFooterProps {
  primaryColor?: string
  mensagemRodape?: string
}

export function AppFooter({ primaryColor, mensagemRodape }: AppFooterProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <footer className="text-xs text-muted-foreground text-center py-4 px-4 space-y-1">
      {mensagemRodape && (
        <p className="text-sm font-medium" style={primaryColor ? { color: primaryColor } : undefined}>
          {mensagemRodape}
        </p>
      )}
      <p>
        {"© 2026 "}
        <span style={primaryColor ? { color: primaryColor } : undefined}>
          Vertyx Tureta e Santos LTDA
        </span>
        {". Todos os direitos reservados."}
      </p>
      {mounted && <p className="mt-0.5">Desenvolvido por Dierison Santos</p>}
    </footer>
  )
}
