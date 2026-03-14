import { NextResponse } from 'next/server'
import { verifySuperAdmin } from '../_lib'

export async function GET(request: Request) {
  const { authorized } = await verifySuperAdmin(request)
  return NextResponse.json({ authorized })
}
