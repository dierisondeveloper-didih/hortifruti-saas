import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { PwaRegister } from '@/components/pwa-register'

const _inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hortifruti Online - Frescor direto do campo',
  description: 'Compre frutas, verduras e legumes frescos com entrega rapida. Veja videos de frescor dos nossos produtos.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hortifruti Online',
  },
  icons: {
    icon: '/logo-principal.png',
    apple: '/logo-principal.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#2d8a4e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <PwaRegister />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
