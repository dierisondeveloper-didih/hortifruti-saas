import { NextResponse } from 'next/server'
import { supabaseAdmin, verifySuperAdmin } from '../_lib'

// ─── POST /api/super-admin/cleanup ───────────────────────────────────────────
// Faz duas coisas e retorna um relatório do que encontrou:
//   1) HEALING: cria configuracoes faltantes para lojas que não têm
//      (ex: criação interrompida no meio).
//   2) DETECÇÃO DE ÓRFÃOS NO AUTH: lista usuários do Auth que não têm
//      loja vinculada (sobra quando a criação quebra entre criar o user
//      e criar a loja). NÃO apaga automaticamente — apenas reporta, para
//      o super admin decidir, evitando exclusão acidental.
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

  // ── 1) Healing: lojas sem configuracoes ──
  const configDonoIds = new Set(configsRes.data?.map((c) => c.dono_id) ?? [])
  const lojasSemConfig = (lojasRes.data ?? []).filter((loja) => !configDonoIds.has(loja.dono_id))

  let configsCriadas = 0
  if (lojasSemConfig.length > 0) {
    const toInsert = lojasSemConfig.map((loja) => ({
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
    configsCriadas = lojasSemConfig.length
  }

  // ── 2) Detecção de usuários no Auth sem loja ──
  const lojaDonoIds = new Set((lojasRes.data ?? []).map((l) => l.dono_id))
  const orfaosAuth: { id: string; email: string | undefined }[] = []

  try {
    // Lista usuários do Auth (paginado). Para a maioria dos casos uma
    // página de 1000 cobre; se crescer muito, paginar adicionalmente.
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (!usersError && usersData?.users) {
      for (const u of usersData.users) {
        // Ignora o próprio super admin (tem email definido em env)
        if (u.email && u.email === process.env.SUPER_ADMIN_EMAIL) continue
        if (!lojaDonoIds.has(u.id)) {
          orfaosAuth.push({ id: u.id, email: u.email })
        }
      }
    }
  } catch (e) {
    // Se a listagem de usuários falhar, não bloqueia o healing já feito
    console.error('Aviso: falha ao listar usuários do Auth:', e)
  }

  // Monta mensagem honesta do que aconteceu
  const partes: string[] = []
  if (configsCriadas > 0) {
    partes.push(`${configsCriadas} configuração(ões) reparada(s)`)
  }
  if (orfaosAuth.length > 0) {
    partes.push(`${orfaosAuth.length} usuário(s) sem loja detectado(s)`)
  }
  const message = partes.length > 0
    ? partes.join(' • ')
    : 'Nenhum problema encontrado. Tudo certo.'

  return NextResponse.json({
    configsCriadas,
    orfaosAuth,           // lista de { id, email } — super admin decide o que fazer
    message,
  })
}

// ─── DELETE /api/super-admin/cleanup ─────────────────────────────────────────
// Exclui um usuário órfão específico do Auth (sem loja). Usado quando o
// super admin confirma que quer remover um órfão detectado no POST.
export async function DELETE(request: Request) {
  const { authorized, error } = await verifySuperAdmin(request)
  if (!authorized) return NextResponse.json({ error }, { status: 403 })

  const { userId } = await request.json()
  if (!userId) {
    return NextResponse.json({ error: 'userId não fornecido' }, { status: 400 })
  }

  // Segurança: confirma que o usuário realmente NÃO tem loja antes de apagar
  const { data: loja } = await supabaseAdmin
    .from('lojas')
    .select('id')
    .eq('dono_id', userId)
    .maybeSingle()

  if (loja) {
    return NextResponse.json(
      { error: 'Este usuário tem uma loja vinculada. Use a exclusão de loja, não o cleanup.' },
      { status: 400 }
    )
  }

  const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
