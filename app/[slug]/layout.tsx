import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params

  try {
    const { data: lojaData } = await supabase
      .from("lojas")
      .select("id, name, dono_id")
      .eq("slug", slug)
      .single()

    if (!lojaData) return {}

    const { data: configData } = await supabase
      .from("configuracoes")
      .select("nome_loja, logo_url")
      .eq("dono_id", lojaData.dono_id)
      .maybeSingle()

    const name = configData?.nome_loja || lojaData.name
    const logoUrl = configData?.logo_url || "/logo-principal.png"

    return {
      title: name,
      manifest: `/${slug}/manifest.json`,
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: name,
      },
      icons: {
        icon: logoUrl,
        apple: logoUrl,
      },
    }
  } catch (e) {
    return {
      manifest: `/${slug}/manifest.json`,
    }
  }
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
