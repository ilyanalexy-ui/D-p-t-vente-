'use client'
import { useEffect, useState } from 'react'

export const SETTINGS_KEY = 'dv_settings'

export function getSettings() {
  if (typeof window === 'undefined') return { jour_reversement: 1, nom_boutique: 'NH Dépôt-Vente', email_boutique: '' }
  try { return { jour_reversement: 1, nom_boutique: 'NH Dépôt-Vente', email_boutique: '', ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } } catch { return { jour_reversement: 1, nom_boutique: 'NH Dépôt-Vente', email_boutique: '' } }
}

export default function Settings() {
  const [jour, setJour] = useState(1)
  const [nom, setNom] = useState('NH Dépôt-Vente')
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const s = getSettings()
    setJour(s.jour_reversement)
    setNom(s.nom_boutique)
    setEmail(s.email_boutique)
  }, [])

  function save() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ jour_reversement: jour, nom_boutique: nom, email_boutique: email }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const IS = { width:'100%', padding:'11px 14px', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', color:'var(--text)' } as any
  const LS = { display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase' as any, letterSpacing:'0.07em', color:'var(--muted)', marginBottom:6 }

  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), jour)
  const nextDate = thisMonth <= today ? new Date(today.getFullYear(), today.getMonth() + 1, jour) : thisMonth
  const daysLeft = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isToday = daysLeft === 0 || today.getDate() === jour

  return (
    <div className="page-content" style={{ padding:32, maxWidth:600 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.03em', marginBottom:4 }}>⚙️ Paramètres</h1>
        <p style={{ fontSize:13, color:'var(--muted)' }}>Configuration de votre boutique</p>
      </div>

      <div className="card" style={{ padding:28, marginBottom:16 }}>
        <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>Informations boutique</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:22 }}>Affiché dans les emails envoyés aux déposants</div>
        <div style={{ marginBottom:18 }}>
          <label style={LS}>Nom de la boutique</label>
          <input value={nom} onChange={e => setNom(e.target.value)} placeholder="NH Dépôt-Vente" style={IS} />
        </div>
        <div>
          <label style={LS}>Email de la boutique</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@boutique.fr" style={IS} />
        </div>
      </div>

      <div className="card" style={{ padding:28, marginBottom:24 }}>
        <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>📅 Récurrence des reversements</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:22 }}>
          Le dashboard vous rappellera de payer les déposants ce jour-là chaque mois
        </div>
        <div style={{ marginBottom:18 }}>
          <label style={LS}>Jour du mois</label>
          <select value={jour} onChange={e => setJour(Number(e.target.value))} style={IS}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>Le {d} de chaque mois</option>
            ))}
          </select>
        </div>

        <div style={{ background: isToday ? 'var(--warning-bg)' : 'var(--info-bg)', border:`1px solid ${isToday ? 'var(--warning)' : 'var(--info)'}`, borderRadius:10, padding:'14px 18px' }}>
          <div style={{ fontSize:13, fontWeight:600, color: isToday ? 'var(--warning)' : 'var(--info)' }}>
            {isToday
              ? "⚠️ C'est aujourd'hui le jour de reversement !"
              : `📅 Prochain reversement : le ${nextDate.toLocaleDateString('fr-FR', { day:'numeric', month:'long' })} — dans ${daysLeft} jour(s)`
            }
          </div>
        </div>
      </div>

      <button onClick={save} className="btn btn-primary" style={{ width:'100%', padding:'14px', fontSize:15 }}>
        {saved ? '✓ Sauvegardé !' : 'Sauvegarder les paramètres'}
      </button>
    </div>
  )
}
