import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const appPassword = process.env.APP_PASSWORD || 'admin'
  const authToken = process.env.AUTH_TOKEN || 'dev-token'

  if (password !== appPassword) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('dv_auth', authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
