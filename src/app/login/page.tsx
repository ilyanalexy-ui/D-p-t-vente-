'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Suspense } from 'react'

function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        const from = searchParams.get('from') || '/'
        router.push(from)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Mot de passe incorrect')
      }
    } catch {
      setError('Erreur réseau, réessayez')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Gradient halo */}
      <div style={{
        position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(196,149,42,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-in" style={{ width: '100%', maxWidth: 360, position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14,
          }}>
            Accès privé
          </div>
          <div className="font-display" style={{
            fontSize: 56, fontWeight: 700, letterSpacing: '-0.02em',
            color: 'var(--text)', lineHeight: 1, marginBottom: 10,
          }}>
            NH
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
            background: 'linear-gradient(90deg, var(--gold-dark) 0%, var(--gold) 55%, var(--gold-light) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Dépôt-Vente
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'var(--gold-bg)', border: '1px solid var(--gold-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <Lock size={20} style={{ color: 'var(--gold)' }} />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 5 }}>
              Connexion
            </h1>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
              Entrez votre mot de passe pour accéder<br />à la gestion de la boutique
            </p>
          </div>

          <form onSubmit={submit}>
            <div style={{ position: 'relative', marginBottom: error ? 10 : 14 }}>
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Mot de passe"
                autoFocus
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '13px 46px 13px 16px',
                  background: 'var(--surface2)',
                  border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 10, fontSize: 15, outline: 'none',
                  fontFamily: 'inherit', color: 'var(--text)',
                  transition: 'var(--transition-fast)',
                }}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                style={{
                  position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: 'var(--muted)', padding: 4, display: 'flex', alignItems: 'center',
                }}
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-bg)', border: '1px solid var(--danger)',
                borderRadius: 9, padding: '9px 13px', fontSize: 13,
                color: 'var(--danger)', fontWeight: 600, marginBottom: 14,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="btn btn-gold"
              style={{ width: '100%', padding: '14px', fontSize: 14 }}
            >
              {loading ? '···' : 'Accéder à la boutique'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 11, color: 'var(--muted)' }}>
          NH Dépôt-Vente · Marseille
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
