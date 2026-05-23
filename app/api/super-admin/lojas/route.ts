import { NextResponse } from 'next/server'
import { supabaseAdmin, verifySuperAdmin } from '../_lib'

// ─── GET /api/super-admin/lojas ──────────────────────────────────────────────
export async function GET(request: Request) {
  const { authorized, error } = await verifySuperAdmin(request)
  if (!authorized) return NextResponse.json({ error }, { status: 403 })

  const [lojasRes, configsRes, produtosRes, pedidosRes] = await Promise.all([
    supabaseAdmin.from('lojas').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('configuracoes').select('dono_id, nome_loja, cor_primaria, telefone_whatsapp'),
    supabaseAdmin.from('produtos').select('dono_id'),
    supabaseAdmin.from('pedidos').select('dono_id'),
  ])

  if (lojasRes.error) {
    return NextResponse.json({ error: lojasRes.error.message }, { status: 500 })
  }

  // Mapas auxiliares para junção em memória
  const configMap: Record<string, { nome_loja: string; cor_primaria: string; telefone_whatsapp: string }> = {}
  configsRes.data?.forEach((c) => { configMap[c.dono_id] = c })

  const produtoCount: Record<string, number> = {}
  produtosRes.data?.forEach((p) => { produtoCount[p.dono_id] = (produtoCount[p.dono_id] ?? 0) + 1 })

  const pedidoCount: Record<string, number> = {}
  pedidosRes.data?.forEach((p) => { pedidoCount[p.dono_id] = (pedidoCount[p.dono_id] ?? 0) + 1 })

  const lojas = (lojasRes.data ?? []).map((loja) => ({
    id: loja.id,
    name: loja.name,
    slug: loja.slug,
    ativo: loja.ativo,
    created_at: loja.created_at,
    dono_id: loja.dono_id,
    config: configMap[loja.dono_id] ?? null,
    produto_count: produtoCount[loja.dono_id] ?? 0,
    pedido_count: pedidoCount[loja.dono_id] ?? 0,
  }))

  return NextResponse.json({ lojas })
}

// ─── PUT /api/super-admin/lojas ───────────────────────────────────────────────
export async function PUT(request: Request) {
  const { authorized, error } = await verifySuperAdmin(request)
  if (!authorized) return NextResponse.json({ error }, { status: 403 })

  const { lojaId, ativo } = await request.json()

  const { error: updateError } = await supabaseAdmin
    .from('lojas')
    .update({ ativo })
    .eq('id', lojaId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// ─── PATCH /api/super-admin/lojas ─────────────────────────────────────────────
export async function PATCH(request: Request) {
  const { authorized, error } = await verifySuperAdmin(request)
  if (!authorized) return NextResponse.json({ error }, { status: 403 })

  const { donoId, newPassword } = await request.json()

  if (!donoId || !newPassword) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(donoId, {
    password: newPassword,
  })

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// ─── DELETE /api/super-admin/lojas ────────────────────────────────────────────
export async function DELETE(request: Request) {
  const { authorized, error } = await verifySuperAdmin(request)
  if (!authorized) return NextResponse.json({ error }, { status: 403 })

  const { donoId } = await request.json()

  // ── Etapa 0: limpar arquivos do Storage ANTES de apagar as linhas ──
  // Os arquivos não têm dono_id no nome, então descobrimos quais apagar
  // pelas URLs gravadas no banco. Precisa ser feito antes de deletar os
  // registros, senão perdemos a referência e o arquivo fica órfão.
  //
  // Extrai o caminho do arquivo (após /public/<bucket>/) de uma URL pública.
  const extractPath = (url: string | null, bucket: string): string | null => {
    if (!url) return null
    const marker = `/public/${bucket}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(url.slice(idx + marker.length))
  }

  try {
    // Coleta URLs de mídia do dono
    const [produtosMedia, configMedia] = await Promise.all([
      supabaseAdmin.from('produtos').select('imagem_url, video_url').eq('dono_id', donoId),
      supabaseAdmin.from('configuracoes').select('logo_url').eq('dono_id', donoId),
    ])

    // Agrupa caminhos por bucket
    const produtosPaths: string[] = []
    const videosPaths: string[] = []
    const logosPaths: string[] = []

    produtosMedia.data?.forEach((p) => {
      const img = extractPath(p.imagem_url, 'produtos')
      if (img) produtosPaths.push(img)
      const vid = extractPath(p.video_url, 'videos_produtos')
      if (vid) videosPaths.push(vid)
    })
    configMedia.data?.forEach((c) => {
      const logo = extractPath(c.logo_url, 'logos_lojas')
      if (logo) logosPaths.push(logo)
    })

    // Remove de cada bucket (ignora erro individual — limpeza é best-effort)
    if (produtosPaths.length) await supabaseAdmin.storage.from('produtos').remove(produtosPaths)
    if (videosPaths.length) await supabaseAdmin.storage.from('videos_produtos').remove(videosPaths)
    if (logosPaths.length) await supabaseAdmin.storage.from('logos_lojas').remove(logosPaths)
  } catch (storageErr) {
    // Não bloqueia a exclusão da loja se a limpeza de arquivos falhar;
    // apenas registra. Os registros do banco ainda serão removidos.
    console.error('Aviso: falha ao limpar arquivos do Storage:', storageErr)
  }

  // ── Etapa 1: itens_pedido (antes de pedidos, por causa da FK) ──
  // Busca os pedidos do dono e apaga os itens vinculados a eles.
  const { data: pedidosDoDono } = await supabaseAdmin
    .from('pedidos')
    .select('id')
    .eq('dono_id', donoId)

  if (pedidosDoDono && pedidosDoDono.length > 0) {
    const pedidoIds = pedidosDoDono.map((p) => p.id)
    const { error: itensError } = await supabaseAdmin
      .from('itens_pedido')
      .delete()
      .in('pedido_id', pedidoIds)
    if (itensError) {
      return NextResponse.json(
        { error: `Falha na etapa 1 (itens_pedido): ${itensError.message}` },
        { status: 500 }
      )
    }
  }

  // ── Etapa 2: pedidos ──
  const { error: pedidosError } = await supabaseAdmin
    .from('pedidos')
    .delete()
    .eq('dono_id', donoId)
  if (pedidosError) {
    return NextResponse.json(
      { error: `Falha na etapa 2 (pedidos): ${pedidosError.message}` },
      { status: 500 }
    )
  }

  // ── Etapa 3: produtos ──
  const { error: produtosError } = await supabaseAdmin
    .from('produtos')
    .delete()
    .eq('dono_id', donoId)
  if (produtosError) {
    return NextResponse.json(
      { error: `Falha na etapa 3 (produtos): ${produtosError.message}` },
      { status: 500 }
    )
  }

  // ── Etapa 4: categorias ──
  const { error: categoriasError } = await supabaseAdmin
    .from('categorias')
    .delete()
    .eq('dono_id', donoId)
  if (categoriasError) {
    return NextResponse.json(
      { error: `Falha na etapa 4 (categorias): ${categoriasError.message}` },
      { status: 500 }
    )
  }

  // ── Etapa 5: configuracoes ──
  const { error: configError } = await supabaseAdmin
    .from('configuracoes')
    .delete()
    .eq('dono_id', donoId)
  if (configError) {
    return NextResponse.json(
      { error: `Falha na etapa 5 (configuracoes): ${configError.message}` },
      { status: 500 }
    )
  }

  // ── Etapa 6: loja ──
  const { error: lojaError } = await supabaseAdmin
    .from('lojas')
    .delete()
    .eq('dono_id', donoId)
  if (lojaError) {
    return NextResponse.json(
      { error: `Falha na etapa 6 (lojas): ${lojaError.message}` },
      { status: 500 }
    )
  }

  // ── Etapa 7: usuário auth ──
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(donoId)
  if (authError) {
    return NextResponse.json(
      { error: `Falha na etapa 7 (auth user): ${authError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
