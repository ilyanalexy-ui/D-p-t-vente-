import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  const adminPassword = process.env.APP_PASSWORD || 'admin'
  const adminToken = process.env.AUTH_TOKEN || 'dev-token'
  const employeePassword = process.env.EMPLOYEE_PASSWORD || 'employe'
  const employeeToken = process.env.EMPLOYEE_TOKEN || 'dev-employee-token'

  let token: string
  let role: string

  if (password === adminPassword) {
    token = adminToken
    role = 'admin'
  } else if (password === employeePassword) {
    token = employeeToken
    role = 'employee'
  } else {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const cookieOpts = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  }

  const res = NextResponse.json({ ok: true, role })
  res.cookies.set('dv_auth', token, { ...cookieOpts, httpOnly: true })
  res.cookies.set('dv_role', role, { ...cookieOpts, httpOnly: false })
  return res
}
