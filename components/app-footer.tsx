import { useState, useEffect } from "react"

interface AppFooterProps {
  primaryColor?: string
}

export function AppFooter({ primaryColor }: AppFooterProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <footer className="text-xs text-muted-foreground text-center py-4 px-4">
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
