'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { LayoutDashboard, Users, Tag, ShoppingCart, Landmark, Settings, Sun, Moon } from 'lucide-react'

const nav = [
  { href: '/',             label: 'Dashboard',      Icon: LayoutDashboard },
  { href: '/deposants',    label: 'Déposants',      Icon: Users },
  { href: '/articles',     label: 'Articles',       Icon: Tag },
  { href: '/caisse',       label: 'Caisse',         Icon: ShoppingCart },
  { href: '/reversements', label: 'Reversements',   Icon: Landmark },
  { href: '/settings',     label: 'Paramètres',     Icon: Settings },
]

export default function Sidebar() {
  const path = usePathname()
  const { dark, toggle } = useTheme()

  return (
    <>
      {/* SIDEBAR DESKTOP */}
      <aside className="sidebar-desktop" style={{
        width: 232, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        flexDirection: 'column',
        padding: '28px 0',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'background 0.4s cubic-bezier(0.4,0,0.2,1), border-color 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 24px 26px', borderBottom: '1px solid var(--border)', marginBottom: 22 }}>
          <div style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: 10,
          }}>
            Boutique
          </div>
          <div className="font-display" style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--text)',
            lineHeight: 1,
            marginBottom: 6,
          }}>
            NH
          </div>
          <div style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            background: 'linear-gradient(90deg, var(--gold-dark) 0%, var(--gold) 55%, var(--gold-light) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Dépôt-Vente
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '0 14px', flex: 1, overflowY: 'auto' }}>
          <div style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            padding: '0 10px',
            marginBottom: 10,
          }}>
            Navigation
          </div>
          {nav.map(({ href, label, Icon }) => {
            const active = path === href
            return (
              <Link key={href} href={href} className={`nav-item${active ? ' active' : ''}`} style={{ marginBottom: 2, display: 'flex' }}>
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0, color: active ? 'var(--gold)' : 'var(--muted)', transition: 'var(--transition-fast)' }} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Dark mode + version */}
        <div style={{ padding: '16px 14px 0', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={toggle}
            className="nav-item"
            style={{ width: '100%', border: 'none', background: 'none', fontFamily: 'inherit', borderLeft: 'none' }}
          >
            {dark
              ? <Sun size={16} strokeWidth={1.8} style={{ flexShrink: 0, color: 'var(--muted)' }} />
              : <Moon size={16} strokeWidth={1.8} style={{ flexShrink: 0, color: 'var(--muted)' }} />
            }
            <span style={{ fontSize: 13 }}>{dark ? 'Mode clair' : 'Mode sombre'}</span>
            <div style={{
              marginLeft: 'auto',
              width: 34, height: 20,
              background: dark ? 'linear-gradient(135deg, var(--gold-dark), var(--gold))' : 'var(--border)',
              borderRadius: 10,
              position: 'relative',
              transition: 'var(--transition)',
              flexShrink: 0,
              boxShadow: dark ? '0 2px 8px rgba(196,149,42,0.28)' : 'none',
            }}>
              <div style={{
                width: 14, height: 14,
                background: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: 3,
                left: dark ? 17 : 3,
                transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
          </button>

          <div style={{
            fontSize: 10,
            color: 'var(--muted)',
            padding: '10px 10px 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            letterSpacing: '0.08em',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', opacity: 0.75 }} />
            v5.0 · Marseille
          </div>
        </div>
      </aside>

      {/* NAVBAR MOBILE */}
      <nav className="mobile-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '8px 4px 14px',
        justifyContent: 'space-around', alignItems: 'center',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        {nav.slice(0, 5).map(({ href, label, Icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href} style={{
              textDecoration: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 12px', borderRadius: 12, minWidth: 52,
              transition: 'var(--transition-fast)',
              background: active ? 'var(--gold-bg)' : 'transparent',
            }}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.7} style={{ color: active ? 'var(--gold)' : 'var(--muted)' }} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? 'var(--gold)' : 'var(--muted)', letterSpacing: '0.02em' }}>
                {label.split(' ')[0]}
              </span>
            </Link>
          )
        })}
        <button onClick={toggle} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          padding: '8px 12px', borderRadius: 12,
          background: 'none', border: 'none', cursor: 'pointer', minWidth: 52,
        }}>
          {dark
            ? <Sun size={22} strokeWidth={1.7} style={{ color: 'var(--muted)' }} />
            : <Moon size={22} strokeWidth={1.7} style={{ color: 'var(--muted)' }} />
          }
          <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--muted)' }}>{dark ? 'Clair' : 'Sombre'}</span>
        </button>
      </nav>
    </>
  )
}
