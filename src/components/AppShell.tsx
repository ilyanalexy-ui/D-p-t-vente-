'use client'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/login') return <>{children}</>
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, background: 'var(--bg)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        {children}
      </main>
    </div>
  )
}
