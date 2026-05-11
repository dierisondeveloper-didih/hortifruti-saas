import { NextResponse } from 'next/server'
import { supabaseAdmin, verifySuperAdmin } from '../_lib'

// GET /api/super-admin/leads
export async function GET(request: Request) {
  const { authorized, error } = await verifySuperAdmin(request)
  if (!authorized) return NextResponse.json({ error }, { status: 403 })

  const { data, error: fetchError } = await supabaseAdmin
    .from('leads')
    .select('*')
    .order('criado_em', { ascending: false })

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  return NextResponse.json({ leads: data })
}

// PUT /api/super-admin/leads (Atualizar status)
export async function PUT(request: Request) {
  const { authorized, error } = await verifySuperAdmin(request)
  if (!authorized) return NextResponse.json({ error }, { status: 403 })

  const { leadId, status } = await request.json()

  const { error: updateError } = await supabaseAdmin
    .from('leads')
    .update({ status })
    .eq('id', leadId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/super-admin/leads
export async function DELETE(request: Request) {
  const { authorized, error } = await verifySuperAdmin(request)
  if (!authorized) return NextResponse.json({ error }, { status: 403 })

  const { leadId } = await request.json()

  const { error: deleteError } = await supabaseAdmin
    .from('leads')
    .delete()
    .eq('id', leadId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
