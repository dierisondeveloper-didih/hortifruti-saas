import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Usamos a chave mestra para ter permissão de criar usuários silenciosamente
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password, nomeLoja, slug } = await request.json()

    // 1. Cria o usuário no sistema de autenticação do Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Já confirma o email automaticamente
    })

    if (authError) throw authError

    const userId = authData.user.id

    // 2. Cria a loja atrelada a esse novo usuário
    const { data: lojaData, error: lojaError } = await supabaseAdmin
      .from('lojas')
      .insert([
        { 
          name: nomeLoja, 
          slug: slug, 
          ativo: true, 
          dono_id: userId 
        }
      ])
      .select()

    if (lojaError) {
      // Se der erro ao criar a loja (ex: slug duplicado), deletamos o usuário para não sujar o banco
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw lojaError
    }

    return NextResponse.json({ success: true, loja: lojaData[0] })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}