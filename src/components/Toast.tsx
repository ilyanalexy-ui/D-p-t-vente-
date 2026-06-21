'use client'
import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'
type ToastItem = { id: number; message: string; type: ToastType }
type ToastCtx = { toast: (message: string, type?: ToastType) => void }

const Ctx = createContext<ToastCtx>({ toast: () => {} })

const cfg = {
  success: { color: 'var(--success)', border: 'var(--success)',      icon: '✓' },
  error:   { color: 'var(--danger)',  border: 'var(--danger)',        icon: '✕' },
  info:    { color: 'var(--gold)',    border: 'var(--gold-border)',   icon: '·' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter.current
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3800)
  }, [])

  const dismiss = (id: number) => setToasts(p => p.filter(t => t.id !== id))

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="toast-container" style={{
        position: 'fixed', bottom: 90, right: 16, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
        maxWidth: 340, width: 'calc(100% - 32px)',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const c = cfg[t.type]
          return (
            <div key={t.id} className="slide-up" style={{
              background: 'var(--surface)',
              border: `1px solid ${c.border}`,
              borderLeft: `3px solid ${c.color}`,
              borderRadius: 12,
              padding: '11px 12px 11px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              pointerEvents: 'all',
            }}>
              <span style={{ color: c.color, fontWeight: 800, fontSize: 15, flexShrink: 0, width: 16, textAlign: 'center', lineHeight: 1 }}>{c.icon}</span>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>{t.message}</span>
              <button onClick={() => dismiss(t.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, padding: '8px', lineHeight: 1, flexShrink: 0, margin: '-8px -4px -8px 0' }}>×</button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() { return useContext(Ctx) }
