'use client'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import { Store, Mail, CalendarDays } from 'lucide-react'

const IS: any = {
  width:'100%', padding:'11px 14px',
  background:'var(--surface2)', border:'1.5px solid var(--border)',
  borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', color:'var(--text)',
}
const LS: any = { display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)', marginBottom:7 }

export default function Settings() {
  const { toast } = useToast()
  const [jour, setJour] = useState(1)
  const [nom, setNom] = useState('NH Dépôt-Vente')
  const [email, setEmail] = useState('')

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
    toast('Paramètres sauvegardés', 'success')
  }

  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), jour)
  const nextDate = thisMonth <= today ? new Date(today.getFullYear(), today.getMonth()+1, jour) : thisMonth
  const daysLeft = Math.ceil((nextDate.getTime()-today.getTime())/(1000*60*60*24))
  const isToday = today.getDate()===jour

  return (
    <div className="page-content" style={{ padding:24, maxWidth:640 }}>

      {/* Header */}
      <div className="reveal reveal-1" style={{ marginBottom:32 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Configuration</div>
        <h1 className="font-display" style={{ fontSize:30, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.1 }}>Paramètres</h1>
        <p style={{ fontSize:12, color:'var(--muted)', marginTop:6 }}>Informations et préférences de votre boutique</p>
      </div>

      {/* Boutique */}
      <div className="card reveal reveal-2" style={{ padding:26, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, paddingBottom:18, borderBottom:'1px solid var(--border)' }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Store size={18} style={{ color:'var(--muted)' }} />
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:14, letterSpacing:'-0.01em' }}>Informations boutique</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>Affiché dans les emails envoyés aux déposants</div>
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={LS}>Nom de la boutique</label>
          <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="NH Dépôt-Vente" style={IS}/>
        </div>
        <div>
          <label style={LS}>Email boutique</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="contact@boutique.fr" style={IS}/>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>Utilisé comme expéditeur dans les notifications déposants</div>
        </div>
      </div>

      {/* Reversements */}
      <div className="card reveal reveal-3" style={{ padding:26, marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, paddingBottom:18, borderBottom:'1px solid var(--border)' }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <CalendarDays size={18} style={{ color:'var(--muted)' }} />
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:14, letterSpacing:'-0.01em' }}>Récurrence des reversements</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>Le dashboard vous rappellera ce jour-là chaque mois</div>
          </div>
        </div>
        <div style={{ marginBottom:18 }}>
          <label style={LS}>Jour du mois</label>
          <select value={jour} onChange={e=>setJour(Number(e.target.value))} style={IS}>
            {Array.from({ length: 28 }, (_,i) => i+1).map(d => (
              <option key={d} value={d}>Le {d} de chaque mois</option>
            ))}
          </select>
        </div>

        {/* Countdown */}
        <div style={{ background: isToday?'var(--warning-bg)':'var(--surface2)', border:`1px solid ${isToday?'var(--warning)':'var(--border)'}`, borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:isToday?'var(--warning)':'var(--muted)', flexShrink:0 }} />
          <div style={{ fontSize:13, fontWeight:600, color:isToday?'var(--warning)':'var(--text2)' }}>
            {isToday
              ? "C'est aujourd'hui le jour de reversement !"
              : `Prochain reversement le ${nextDate.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})} — dans ${daysLeft} jour${daysLeft>1?'s':''}`
            }
          </div>
        </div>
      </div>

      <button onClick={save} className="btn btn-gold reveal reveal-4" style={{ width:'100%', padding:'14px', fontSize:14 }}>
        Sauvegarder les paramètres
      </button>
    </div>
  )
}
