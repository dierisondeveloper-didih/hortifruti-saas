import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  try {
    // 1. Busca a loja pelo slug
    const { data: lojaData, error: lojaError } = await supabase
      .from("lojas")
      .select("id, name, dono_id")
      .eq("slug", slug)
      .single()

    if (lojaError || !lojaData) {
      return new NextResponse("Loja não encontrada", { status: 404 })
    }

    // 2. Busca as configurações para pegar a logo e cor
    const { data: configData } = await supabase
      .from("configuracoes")
      .select("nome_loja, logo_url, cor_primaria")
      .eq("dono_id", lojaData.dono_id)
      .maybeSingle()

    const name = configData?.nome_loja || lojaData.name
    const themeColor = configData?.cor_primaria || "#2d8a4e"
    const logoUrl = configData?.logo_url || "/logo-principal.png"

    const manifest = {
      name: name,
      short_name: name.substring(0, 12),
      description: `Peça no hortifruti ${name}`,
      id: `/${slug}`,
      start_url: `/${slug}`,
      scope: `/${slug}`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: themeColor,
      orientation: "portrait",
      icons: [
        {
          src: logoUrl,
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: logoUrl,
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        }
      ]
    }

    return NextResponse.json(manifest, {
      headers: {
        "Content-Type": "application/manifest+json",
      },
    })
  } catch (error) {
    return new NextResponse("Erro interno", { status: 500 })
  }
}
