'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useState } from 'react'

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
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavItems = () => (
    <>
      {nav.map(({ href, label, icon }) => {
        const active = path === href
        return (
          <Link key={href} href={href} style={{ textDecoration:'none', display:'block', marginBottom:3 }} onClick={() => setMobileOpen(false)}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 12px', borderRadius:10, fontSize:13.5, fontWeight:active?700:500, color:active?'var(--bg)':'var(--text2)', background:active?'var(--accent)':'transparent', transition:'all 0.15s' }}>
              <span style={{ fontSize:18, lineHeight:1, flexShrink:0 }}>{icon}</span>
              {label}
            </div>
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* SIDEBAR DESKTOP */}
      <aside className="sidebar-desktop" style={{ width:220, flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', flexDirection:'column', padding:'24px 0', height:'100vh', transition:'background 0.2s', position:'sticky', top:0 }}>
        <div style={{ padding:'0 20px 24px', borderBottom:'1px solid var(--border)', marginBottom:16 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--muted)', marginBottom:4 }}>SaaS</div>
          <div style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.03em', color:'var(--text)' }}>
            NH<span style={{ fontWeight:300, color:'var(--muted)' }}> Dépôt-Vente</span>
          </div>
        </div>
        <nav style={{ padding:'0 12px', flex:1, overflowY:'auto' }}>
          <NavItems />
        </nav>
        <div style={{ padding:'16px 12px', borderTop:'1px solid var(--border)' }}>
          <button onClick={toggle} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'none', border:'none', cursor:'pointer', fontSize:13.5, fontWeight:500, color:'var(--text2)', fontFamily:'inherit' }}>
            <span>{dark?'☀️':'🌙'}</span>
            {dark?'Mode clair':'Mode sombre'}
            <div style={{ marginLeft:'auto', width:34, height:20, background:dark?'var(--accent)':'var(--border)', borderRadius:10, position:'relative', transition:'background 0.2s', flexShrink:0 }}>
              <div style={{ width:14, height:14, background:dark?'var(--bg)':'white', borderRadius:'50%', position:'absolute', top:3, left:dark?17:3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </button>
        </div>
      </aside>

      {/* NAVBAR MOBILE */}
      <nav className="mobile-nav" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, background:'var(--surface)', borderTop:'1px solid var(--border)', padding:'8px 4px', justifyContent:'space-around', alignItems:'center' }}>
        {nav.slice(0,5).map(({ href, label, icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href} style={{ textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 10px', borderRadius:10, background:active?'var(--accent)':'transparent', minWidth:52, transition:'background 0.15s' }}>
              <span style={{ fontSize:20 }}>{icon}</span>
              <span style={{ fontSize:10, fontWeight:active?700:500, color:active?'var(--bg)':'var(--muted)' }}>{label.split(' ')[0]}</span>
            </Link>
          )
        })}
        <button onClick={toggle} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 10px', borderRadius:10, background:'none', border:'none', cursor:'pointer', minWidth:52 }}>
          <span style={{ fontSize:20 }}>{dark?'☀️':'🌙'}</span>
          <span style={{ fontSize:10, fontWeight:500, color:'var(--muted)' }}>{dark?'Clair':'Sombre'}</span>
        </button>
      </nav>
    </>
  )
}
