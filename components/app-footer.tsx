interface AppFooterProps {
  primaryColor?: string
}

export function AppFooter({ primaryColor }: AppFooterProps) {
  return (
    <footer className="text-xs text-muted-foreground text-center py-4 px-4">
      <p>
        {"© 2026 "}
        <span style={primaryColor ? { color: primaryColor } : undefined}>
          Vertyx Tureta e Santos SA
        </span>
        {". Todos os direitos reservados."}
      </p>
      <p className="mt-0.5">Desenvolvido por Dierison Silva</p>
    </footer>
  )
}
