'use client'
import { useEffect, useState } from 'react'

export default function Settings() {
  const [jour, setJour] = useState(1)
  const [nom, setNom] = useState('NH Dépôt-Vente')
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('dv_settings') || '{}')
      if (s.jour_reversement) setJour(s.jour_reversement)
      if (s.nom_boutique) setNom(s.nom_boutique)
      if (s.email_boutique) setEmail(s.email_boutique)
    } catch {}
  }, [])

  function save() {
    localStorage.setItem('dv_settings', JSON.stringify({ jour_reversement: jour, nom_boutique: nom, email_boutique: email }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), jour)
  const nextDate = thisMonth <= today ? new Date(today.getFullYear(), today.getMonth() + 1, jour) : thisMonth
  const daysLeft = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isToday = today.getDate() === jour

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: 'var(--surface2)',
    border: '1.5px solid var(--border)',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    color: 'var(--text)',
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4 }}>⚙️ Paramètres</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Configuration de votre boutique</p>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Informations boutique</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 22 }}>Affiché dans les emails aux déposants</div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Nom de la boutique</label>
          <input value={nom} onChange={e => setNom(e.target.value)} placeholder="NH Dépôt-Vente" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Email boutique</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@boutique.fr" style={inputStyle} />
        </div>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>📅 Récurrence des reversements</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 22 }}>Le dashboard vous rappellera ce jour-là chaque mois</div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Jour du mois</label>
          <select value={jour} onChange={e => setJour(Number(e.target.value))} style={inputStyle}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>Le {d} de chaque mois</option>
            ))}
          </select>
        </div>
        <div style={{ background: isToday ? 'var(--warning-bg)' : 'var(--info-bg)', border: `1px solid ${isToday ? 'var(--warning)' : 'var(--info)'}`, borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? 'var(--warning)' : 'var(--info)' }}>
            {isToday ? "⚠️ C'est aujourd'hui le jour de reversement !" : `📅 Prochain : le ${nextDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — dans ${daysLeft} jour(s)`}
          </div>
        </div>
      </div>

      <button onClick={save} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15 }}>
        {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
      </button>
    </div>
  )
}