'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Deposants() {
  const [deposants, setDeposants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmDel, setConfirmDel] = useState<any>(null)
  const [form, setForm] = useState({ nom:'', prenom:'', telephone:'', email:'', iban:'', notes:'' })

  async function load() {
    const { data } = await supabase.from('vue_deposants_stats').select('*').order('nom')
    setDeposants(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save() {
    if (!form.nom || !form.prenom) return alert('Nom et prénom requis')
    setSaving(true)
    const { error } = await supabase.from('deposants').insert([form])
    if (error) { alert('Erreur : ' + error.message); setSaving(false); return }
    setForm({ nom:'', prenom:'', telephone:'', email:'', iban:'', notes:'' })
    setShowForm(false); setSaving(false); load()
  }

  async function supprimer(id: string) {
    const { error } = await supabase.from('deposants').delete().eq('id', id)
    if (error) return alert('Erreur : ' + error.message)
    setConfirmDel(null); load()
  }

  const filtered = deposants.filter(d => `${d.nom} ${d.prenom} ${d.email||''} ${d.telephone||''}`.toLowerCase().includes(search.toLowerCase()))
  const IS = { width:'100%', padding:'11px 14px', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', color:'var(--text)' } as any
  const LS = { display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase' as any, letterSpacing:'0.07em', color:'var(--muted)', marginBottom:6 }

  return (
    <div className="page-content" style={{ padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.03em', marginBottom:4 }}>👤 Déposants</h1>
          <p style={{ fontSize:13, color:'var(--muted)' }}>{deposants.length} déposant(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nouveau</button>
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{ ...IS, maxWidth:340, marginBottom:20 }}/>

      {confirmDel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card" style={{ padding:28, maxWidth:360, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:14 }}>⚠️</div>
            <div style={{ fontSize:17, fontWeight:800, marginBottom:8 }}>Supprimer {confirmDel.prenom} ?</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>Action irréversible.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={() => supprimer(confirmDel.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
          <div className="card" style={{ width:'100%', maxWidth:480, padding:28, margin:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <h2 style={{ fontSize:18, fontWeight:800 }}>Nouveau déposant</h2>
              <button onClick={() => setShowForm(false)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:22, color:'var(--muted)' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={LS}>Prénom *</label><input value={form.prenom} onChange={e=>setForm(p=>({...p,prenom:e.target.value}))} placeholder="Marie" style={IS}/></div>
              <div><label style={LS}>Nom *</label><input value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="Martin" style={IS}/></div>
            </div>
            {[['Téléphone','telephone','06 12 34 56 78','tel'],['Email','email','marie@email.fr','email'],['IBAN','iban','FR76…','text'],['Notes','notes','Infos…','text']].map(([l,k,p,t]) => (
              <div key={k} style={{ marginBottom:14 }}>
                <label style={LS}>{l}</label>
                <input type={t} value={(form as any)[k]} onChange={e=>setForm(prev=>({...prev,[k]:e.target.value}))} placeholder={p} style={IS}/>
              </div>
            ))}
            <button onClick={save} disabled={saving} className="btn btn-primary" style={{ width:'100%', padding:'13px', marginTop:8 }}>
              {saving?'Enregistrement…':'Créer le déposant'}
            </button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>Chargement…</div> : filtered.length===0 ? (
        <div className="card" style={{ padding:60, textAlign:'center', color:'var(--muted)' }}><div style={{ fontSize:40, marginBottom:12 }}>👤</div><div style={{ fontWeight:700 }}>Aucun déposant</div></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px,1fr))', gap:14 }}>
          {filtered.map(d => (
            <div key={d.id} className="card" style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--accent)', color:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, flexShrink:0 }}>
                  {d.prenom?.[0]}{d.nom?.[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:14 }}>{d.prenom} {d.nom}</div>
                  {d.telephone && <div style={{ fontSize:12, color:'var(--muted)' }}>{d.telephone}</div>}
                </div>
                <button onClick={() => setConfirmDel(d)} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--muted)', fontSize:15, padding:4 }}>🗑</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
                {[['Rayon',d.articles_en_rayon||0,'var(--muted)'],['Vendus',d.articles_vendus||0,'var(--success)'],['Cagnotte',`${Number(d.cagnotte_a_reverser||0).toFixed(0)}€`,'var(--warning)']].map(([l,v,c]:any) => (
                  <div key={l} style={{ background:'var(--surface2)', borderRadius:8, padding:'8px', textAlign:'center', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:16, fontWeight:900, color:c }}>{v}</div>
                    <div style={{ fontSize:10, color:'var(--muted)', marginTop:2, fontWeight:600, textTransform:'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>
              {d.email && <div style={{ fontSize:12, color:'var(--muted)' }}>✉️ {d.email}</div>}
              {Number(d.cagnotte_a_reverser) > 0 && (
                <div style={{ marginTop:10, background:'var(--warning-bg)', border:'1px solid var(--warning)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--warning)', fontWeight:700 }}>
                  💰 {Number(d.cagnotte_a_reverser).toFixed(2)} € à reverser
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
