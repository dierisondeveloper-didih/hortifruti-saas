import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Verifica se o request vem de um super admin autenticado.
 * Lê o token do header Authorization: Bearer <token>
 * e compara o e-mail com SUPER_ADMIN_EMAIL (variável server-side).
 */
export async function verifySuperAdmin(
  request: Request
): Promise<{ authorized: boolean; error?: string }> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Token não fornecido' }
  }

  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return { authorized: false, error: 'Token inválido' }
  }

  if (user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return { authorized: false, error: 'Acesso negado' }
  }

  return { authorized: true }
}
