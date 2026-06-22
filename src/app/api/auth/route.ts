import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const adminToken = process.env.AUTH_TOKEN || 'dev-token'
  const employeeToken = process.env.EMPLOYEE_TOKEN || 'employee-open'

  let token: string
  let role: string

  if (body.employee === true) {
    // Accès employé sans mot de passe
    token = employeeToken
    role = 'employee'
  } else {
    const adminPassword = process.env.APP_PASSWORD || 'admin'
    if (body.password !== adminPassword) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
    }
    token = adminToken
    role = 'admin'
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
