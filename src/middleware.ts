import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_ONLY = ['/', '/deposants', '/reversements', '/settings']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('dv_auth')?.value
  const adminToken = process.env.AUTH_TOKEN || 'dev-token'
  const employeeToken = process.env.EMPLOYEE_TOKEN || 'dev-employee-token'

  const isAdmin = token === adminToken
  const isEmployee = token === employeeToken

  if (!isAdmin && !isEmployee) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  if (isEmployee && ADMIN_ONLY.includes(pathname)) {
    return NextResponse.redirect(new URL('/caisse', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
}
