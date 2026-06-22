'use client'
import { usePathname } from 'next/navigation'
import { ReactNode, createContext, useContext, useState, useEffect } from 'react'
import Sidebar from './Sidebar'

export type Role = 'admin' | 'employee'
const RoleCtx = createContext<Role>('admin')
export const useRole = () => useContext(RoleCtx)

function readRole(): Role {
  if (typeof document === 'undefined') return 'admin'
  const m = document.cookie.match(/dv_role=([^;]+)/)
  return m?.[1] === 'employee' ? 'employee' : 'admin'
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [role, setRole] = useState<Role>('admin')

  useEffect(() => { setRole(readRole()) }, [])

  if (pathname === '/login') return <>{children}</>
  return (
    <RoleCtx.Provider value={role}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, background: 'var(--bg)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
          {children}
        </main>
      </div>
    </RoleCtx.Provider>
  )
}
