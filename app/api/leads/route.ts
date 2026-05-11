import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { nome_responsavel, nome_loja, telefone_whatsapp } = await request.json()

    if (!nome_responsavel || !nome_loja || !telefone_whatsapp) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 })
    }

    const { error } = await supabase
      .from('leads')
      .insert([{
        nome_responsavel,
        nome_loja,
        telefone_whatsapp
      }])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
