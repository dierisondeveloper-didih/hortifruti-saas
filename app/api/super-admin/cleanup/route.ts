import { NextResponse } from 'next/server'
import { supabaseAdmin, verifySuperAdmin } from '../_lib'

// ─── POST /api/super-admin/cleanup ───────────────────────────────────────────
export async function POST(request: Request) {
  const { authorized, error } = await verifySuperAdmin(request)
  if (!authorized) return NextResponse.json({ error }, { status: 403 })

  const [lojasRes, configsRes] = await Promise.all([
    supabaseAdmin.from('lojas').select('*'),
    supabaseAdmin.from('configuracoes').select('dono_id'),
  ])

  if (lojasRes.error) {
    return NextResponse.json({ error: lojasRes.error.message }, { status: 500 })
  }

  const configDonoIds = new Set(configsRes.data?.map((c) => c.dono_id) ?? [])
  const orphans = (lojasRes.data ?? []).filter((loja) => !configDonoIds.has(loja.dono_id))

  if (orphans.length === 0) {
    return NextResponse.json({ created: 0, message: 'Nenhum registro órfão encontrado.' })
  }

  const toInsert = orphans.map((loja) => ({
    dono_id: loja.dono_id,
    nome_loja: loja.name,
    cor_primaria: '#2d8a4e',
    telefone_whatsapp: '',
    taxa_entrega: 0,
  }))

  const { error: insertError } = await supabaseAdmin.from('configuracoes').insert(toInsert)
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    created: orphans.length,
    message: `${orphans.length} configuração(ões) criada(s) com sucesso.`,
  })
}
