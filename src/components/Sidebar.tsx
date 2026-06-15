'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'

const nav = [
  { href: '/',             label: 'Dashboard',    icon: '📊' },
  { href: '/deposants',    label: 'Déposants',    icon: '👤' },
  { href: '/articles',     label: 'Articles',     icon: '🏷️' },
  { href: '/caisse',       label: 'Caisse',       icon: '🛒' },
  { href: '/reversements', label: 'Reversements', icon: '💰' },
  { href: '/settings',     label: 'Paramètres',   icon: '⚙️' },
]

export default function Sidebar() {
  const path = usePathname()
  const { dark, toggle } = useTheme()

  return (
    <>
      {/* SIDEBAR DESKTOP */}
      <aside className="sidebar-desktop" style={{
        width: 220, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        flexDirection: 'column',
        padding: '24px 0',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'var(--transition-slow)',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
            Boutique
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.1 }}>
            NH
          </div>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            background: 'linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #A07830 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            DÉPÔT-VENTE
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '0 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', padding: '0 8px', marginBottom: 8 }}>Menu</div>
          {nav.map(({ href, label, icon }) => {
            const active = path === href
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none', display: 'block', marginBottom: 3 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  fontSize: 13.5, fontWeight: active ? 700 : 500,
                  color: active ? '#1A1A1A' : 'var(--text2)',
                  background: active
                    ? 'linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #A07830 100%)'
                    : 'transparent',
                  boxShadow: active ? '0 2px 8px rgba(201,168,76,0.3)' : 'none',
                  transition: 'var(--transition-fast)',
                }}>
                  <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                  {label}
                  {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,0,0,0.3)' }} />}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Dark mode + version */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <button onClick={toggle} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13.5, fontWeight: 500, color: 'var(--text2)', fontFamily: 'inherit',
            transition: 'var(--transition-fast)',
          }}>
            <span>{dark ? '☀️' : '🌙'}</span>
            {dark ? 'Mode clair' : 'Mode sombre'}
            <div style={{ marginLeft: 'auto', width: 34, height: 20, background: dark ? 'linear-gradient(135deg, #C9A84C, #E8C96A)' : 'var(--border)', borderRadius: 10, position: 'relative', transition: 'var(--transition)', flexShrink: 0, boxShadow: dark ? '0 2px 6px rgba(201,168,76,0.3)' : 'none' }}>
              <div style={{ width: 14, height: 14, background: 'white', borderRadius: '50%', position: 'absolute', top: 3, left: dark ? 17 : 3, transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </button>
          <div style={{ fontSize: 11, color: 'var(--muted)', padding: '6px 12px 0', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
            v5.0 · Marseille
          </div>
        </div>
      </aside>

      {/* NAVBAR MOBILE */}
      <nav className="mobile-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '6px 4px 10px',
        justifyContent: 'space-around', alignItems: 'center',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {nav.slice(0, 5).map(({ href, label, icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '7px 10px', borderRadius: 10, minWidth: 52, transition: 'var(--transition-fast)',
              background: active ? 'linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #A07830 100%)' : 'transparent',
              boxShadow: active ? '0 2px 8px rgba(201,168,76,0.25)' : 'none',
            }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#1A1A1A' : 'var(--muted)' }}>{label.split(' ')[0]}</span>
            </Link>
          )
        })}
        <button onClick={toggle} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '7px 10px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', minWidth: 52, transition: 'var(--transition-fast)' }}>
          <span style={{ fontSize: 20 }}>{dark ? '☀️' : '🌙'}</span>
          <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--muted)' }}>{dark ? 'Clair' : 'Sombre'}</span>
        </button>
      </nav>
    </>
  )
}
