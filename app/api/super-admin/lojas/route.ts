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

  // Etapa 1: pedidos
  // Nota: se itens_pedido não tiver ON DELETE CASCADE, deletar manualmente antes.
  const { error: pedidosError } = await supabaseAdmin
    .from('pedidos')
    .delete()
    .eq('dono_id', donoId)
  if (pedidosError) {
    return NextResponse.json(
      { error: `Falha na etapa 1 (pedidos): ${pedidosError.message}` },
      { status: 500 }
    )
  }

  // Etapa 2: produtos
  const { error: produtosError } = await supabaseAdmin
    .from('produtos')
    .delete()
    .eq('dono_id', donoId)
  if (produtosError) {
    return NextResponse.json(
      { error: `Falha na etapa 2 (produtos): ${produtosError.message}` },
      { status: 500 }
    )
  }

  // Etapa 3: categorias
  const { error: categoriasError } = await supabaseAdmin
    .from('categorias')
    .delete()
    .eq('dono_id', donoId)
  if (categoriasError) {
    return NextResponse.json(
      { error: `Falha na etapa 3 (categorias): ${categoriasError.message}` },
      { status: 500 }
    )
  }

  // Etapa 4: configuracoes
  const { error: configError } = await supabaseAdmin
    .from('configuracoes')
    .delete()
    .eq('dono_id', donoId)
  if (configError) {
    return NextResponse.json(
      { error: `Falha na etapa 4 (configuracoes): ${configError.message}` },
      { status: 500 }
    )
  }

  // Etapa 5: loja
  const { error: lojaError } = await supabaseAdmin
    .from('lojas')
    .delete()
    .eq('dono_id', donoId)
  if (lojaError) {
    return NextResponse.json(
      { error: `Falha na etapa 5 (lojas): ${lojaError.message}` },
      { status: 500 }
    )
  }

  // Etapa 6: usuário auth
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(donoId)
  if (authError) {
    return NextResponse.json(
      { error: `Falha na etapa 6 (auth user): ${authError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
