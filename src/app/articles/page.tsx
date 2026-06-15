'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const TYPES = ['Hoodie','Sneaker','T-Shirt','Veste','Pantalon','Short','Robe','Accessoire','Autre']
const ETATS = ['Neuf avec étiquette','Excellent','Bon','Correct']

export default function Articles() {
  const [articles, setArticles] = useState<any[]>([])
  const [deposants, setDeposants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showQR, setShowQR] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [filterStatut, setFilterStatut] = useState('tous')
  const [search, setSearch] = useState('')
  const [searchDep, setSearchDep] = useState('')
  const [confirmDel, setConfirmDel] = useState<any>(null)
  const [comMode, setComMode] = useState<'pct'|'eur'>('pct')
  const [form, setForm] = useState({ deposant_id:'', type:'Hoodie', marque:'', modele:'', taille:'', etat:'Excellent', prix_vente:'', commission_boutique:'50', commission_deposant:'50', com_b_eur:'', com_d_eur:'' })

  async function load() {
    const { data: a } = await supabase.from('articles').select('*, deposants(nom,prenom)').order('created_at',{ascending:false})
    setArticles(a || [])
    const { data: d } = await supabase.from('deposants').select('id,nom,prenom').order('nom')
    setDeposants(d || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const depFiltered = deposants.filter(d => `${d.prenom} ${d.nom}`.toLowerCase().includes(searchDep.toLowerCase()))

  function updateComPct(key: string, val: string) {
    const n = parseFloat(val)||0
    setForm(p => ({ ...p, [key]: val, [key==='commission_boutique'?'commission_deposant':'commission_boutique']: String(Math.max(0,100-n)) }))
  }

  function updateComEur(key: string, val: string) {
    const prix = parseFloat(form.prix_vente)||0
    const n = parseFloat(val)||0
    const other = Math.max(0, prix-n).toFixed(2)
    if (key==='com_b_eur') setForm(p => ({...p, com_b_eur:val, com_d_eur:other}))
    else setForm(p => ({...p, com_d_eur:val, com_b_eur:other}))
  }

  async function save() {
    if (!form.deposant_id||!form.marque||!form.prix_vente) return alert('Déposant, marque et prix requis')
    let cb: number, cd: number
    if (comMode==='pct') { cb=parseFloat(form.commission_boutique); cd=parseFloat(form.commission_deposant) }
    else {
      const p = parseFloat(form.prix_vente)
      const b = parseFloat(form.com_b_eur)||0
      cb = Math.round((b/p)*10000)/100; cd = Math.round(100-cb)
    }
    setSaving(true)
    const { error } = await supabase.from('articles').insert([{
      deposant_id:form.deposant_id, type:form.type, marque:form.marque,
      modele:form.modele||null, taille:form.taille||null, etat:form.etat,
      prix_vente:parseFloat(form.prix_vente), commission_boutique:cb, commission_deposant:cd,
    }])
    if (error) { alert('Erreur : '+error.message); setSaving(false); return }
    setShowForm(false); setSaving(false)
    setForm({ deposant_id:'', type:'Hoodie', marque:'', modele:'', taille:'', etat:'Excellent', prix_vente:'', commission_boutique:'50', commission_deposant:'50', com_b_eur:'', com_d_eur:'' })
    setSearchDep(''); load()
  }

  async function supprimer(id: string) {
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (error) return alert('Erreur : '+error.message)
    setConfirmDel(null); load()
  }

  const filtered = articles.filter(a => {
    const ms = filterStatut==='tous' || a.statut===filterStatut
    const mq = `${a.marque} ${a.modele||''} ${a.type} ${a.deposants?.nom||''} ${a.deposants?.prenom||''}`.toLowerCase().includes(search.toLowerCase())
    return ms && mq
  })

  const prix = parseFloat(form.prix_vente)||0
  const partB = (prix*parseFloat(form.commission_boutique||'0')/100).toFixed(2)
  const partD = (prix*parseFloat(form.commission_deposant||'0')/100).toFixed(2)
  const sL:any = { en_rayon:'En rayon', vendu:'Vendu', recupere:'Récupéré' }
  const sB:any = { en_rayon:'badge-gray', vendu:'badge-green', recupere:'badge-red' }
  const IS = { width:'100%', padding:'11px 14px', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', color:'var(--text)' } as any
  const LS = { display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase' as any, letterSpacing:'0.07em', color:'var(--muted)', marginBottom:6 }

  return (
    <div className="page-content" style={{ padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.03em', marginBottom:4 }}>🏷️ Articles</h1>
          <p style={{ fontSize:13, color:'var(--muted)' }}>{articles.length} article(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Ajouter</button>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{ ...IS, maxWidth:260, flex:1 }}/>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[['tous','Tous'],['en_rayon','En rayon'],['vendu','Vendus'],['recupere','Récupérés']].map(([v,l]) => (
            <button key={v} onClick={()=>setFilterStatut(v)} style={{ padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:filterStatut===v?'var(--accent)':'var(--surface)', color:filterStatut===v?'var(--bg)':'var(--text2)', fontSize:13, fontWeight:600, cursor:'pointer' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card" style={{ padding:28, maxWidth:300, width:'100%', textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <span style={{ fontWeight:800, fontSize:15 }}>Étiquette QR</span>
              <button onClick={() => setShowQR(null)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:22, color:'var(--muted)' }}>×</button>
            </div>
            <div style={{ background:'white', border:'1px solid #E8E7E3', borderRadius:12, padding:20, marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'#999', marginBottom:8 }}>NH DÉPÔT-VENTE</div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${showQR.qr_code_id}`} alt="QR" style={{ width:150, height:150, margin:'0 auto 12px', display:'block' }}/>
              <div style={{ fontSize:9, fontFamily:'monospace', color:'#999', marginBottom:8 }}>{showQR.qr_code_id}</div>
              <div style={{ fontSize:14, fontWeight:800, color:'#111', marginBottom:2 }}>{showQR.marque} {showQR.modele||showQR.type}</div>
              <div style={{ fontSize:11, color:'#888', marginBottom:10 }}>{showQR.type} · {showQR.taille||'—'} · {showQR.etat}</div>
              <div style={{ fontSize:28, fontWeight:900, color:'#111' }}>{Number(showQR.prix_vente).toFixed(2)} €</div>
            </div>
            <button onClick={() => window.print()} className="btn btn-primary" style={{ width:'100%' }}>🖨 Imprimer</button>
          </div>
        </div>
      )}

      {/* Confirm del */}
      {confirmDel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card" style={{ padding:28, maxWidth:360, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:14 }}>🗑️</div>
            <div style={{ fontSize:17, fontWeight:800, marginBottom:8 }}>Supprimer cet article ?</div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{confirmDel.marque} {confirmDel.modele||confirmDel.type}</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>Action irréversible.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={() => supprimer(confirmDel.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Form ajout */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
          <div className="card" style={{ width:'100%', maxWidth:520, padding:28, margin:'auto', maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <h2 style={{ fontSize:18, fontWeight:800 }}>Ajouter un article</h2>
              <button onClick={() => setShowForm(false)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:22, color:'var(--muted)' }}>×</button>
            </div>

            {/* Recherche déposant */}
            <div style={{ marginBottom:16 }}>
              <label style={LS}>Déposant *</label>
              <input value={searchDep} onChange={e=>setSearchDep(e.target.value)} placeholder="🔍 Rechercher un déposant…" style={{ ...IS, marginBottom:6 }}/>
              {searchDep && (
                <div style={{ border:'1px solid var(--border)', borderRadius:10, background:'var(--surface)', maxHeight:140, overflowY:'auto' }}>
                  {depFiltered.length===0 ? (
                    <div style={{ padding:'12px 14px', fontSize:13, color:'var(--muted)' }}>Aucun résultat</div>
                  ) : depFiltered.map(d => (
                    <div key={d.id} onClick={() => { setForm(p=>({...p,deposant_id:d.id})); setSearchDep(`${d.prenom} ${d.nom}`) }} style={{ padding:'11px 14px', fontSize:13.5, fontWeight:600, cursor:'pointer', background:form.deposant_id===d.id?'var(--accent)':'transparent', color:form.deposant_id===d.id?'var(--bg)':'var(--text)', borderBottom:'1px solid var(--border)' }}>
                      {d.prenom} {d.nom}
                    </div>
                  ))}
                </div>
              )}
              {form.deposant_id && !searchDep.includes(' ') && (
                <div style={{ fontSize:12, color:'var(--success)', marginTop:4, fontWeight:600 }}>✓ Déposant sélectionné</div>
              )}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div><label style={LS}>Type</label><select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={IS}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div><label style={LS}>Marque *</label><input value={form.marque} onChange={e=>setForm(p=>({...p,marque:e.target.value}))} placeholder="Nike…" style={IS}/></div>
              <div><label style={LS}>Modèle</label><input value={form.modele} onChange={e=>setForm(p=>({...p,modele:e.target.value}))} placeholder="Air Jordan…" style={IS}/></div>
              <div><label style={LS}>Taille</label><input value={form.taille} onChange={e=>setForm(p=>({...p,taille:e.target.value}))} placeholder="M, US 10…" style={IS}/></div>
              <div><label style={LS}>État</label><select value={form.etat} onChange={e=>setForm(p=>({...p,etat:e.target.value}))} style={IS}>{ETATS.map(e=><option key={e}>{e}</option>)}</select></div>
              <div><label style={LS}>Prix (€) *</label><input type="number" value={form.prix_vente} onChange={e=>setForm(p=>({...p,prix_vente:e.target.value}))} placeholder="0.00" style={IS}/></div>
            </div>

            {/* Commission */}
            <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--muted)' }}>Commission</div>
                <div style={{ display:'flex', gap:6 }}>
                  {[['pct','%'],['eur','€']].map(([v,l]) => (
                    <button key={v} onClick={()=>setComMode(v as any)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:comMode===v?'var(--accent)':'transparent', color:comMode===v?'var(--bg)':'var(--text2)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{l}</button>
                  ))}
                </div>
              </div>
              {comMode==='pct' ? (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={LS}>% Boutique</label>
                    <input type="number" min="0" max="100" value={form.commission_boutique} onChange={e=>updateComPct('commission_boutique',e.target.value)} style={IS}/>
                    {prix>0 && <div style={{ fontSize:12, fontWeight:700, color:'var(--info)', marginTop:5 }}>{partB} €</div>}
                  </div>
                  <div>
                    <label style={{ ...LS, color:'var(--success)' }}>% Déposant</label>
                    <input type="number" min="0" max="100" value={form.commission_deposant} onChange={e=>updateComPct('commission_deposant',e.target.value)} style={{ ...IS, borderColor:'var(--success)' }}/>
                    {prix>0 && <div style={{ fontSize:12, fontWeight:700, color:'var(--success)', marginTop:5 }}>{partD} €</div>}
                  </div>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={LS}>€ Boutique</label>
                    <input type="number" min="0" value={form.com_b_eur} onChange={e=>updateComEur('com_b_eur',e.target.value)} placeholder="0.00" style={IS}/>
                    {prix>0 && form.com_b_eur && <div style={{ fontSize:12, color:'var(--info)', marginTop:5 }}>{Math.round((parseFloat(form.com_b_eur)/prix)*100)}%</div>}
                  </div>
                  <div>
                    <label style={{ ...LS, color:'var(--success)' }}>€ Déposant</label>
                    <input type="number" min="0" value={form.com_d_eur} onChange={e=>updateComEur('com_d_eur',e.target.value)} placeholder="0.00" style={{ ...IS, borderColor:'var(--success)' }}/>
                    {prix>0 && form.com_d_eur && <div style={{ fontSize:12, color:'var(--success)', marginTop:5 }}>{Math.round((parseFloat(form.com_d_eur)/prix)*100)}%</div>}
                  </div>
                </div>
              )}
            </div>

            <button onClick={save} disabled={saving} className="btn btn-primary" style={{ width:'100%', padding:'14px' }}>
              {saving?'Enregistrement…':'+ Ajouter & Générer QR Code'}
            </button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>Chargement…</div> : filtered.length===0 ? (
        <div className="card" style={{ padding:60, textAlign:'center', color:'var(--muted)' }}><div style={{ fontSize:40 }}>📦</div><div style={{ fontWeight:700, marginTop:12 }}>Aucun article</div></div>
      ) : (
        <div className="card table-scroll" style={{ overflow:'hidden' }}>
          <table>
            <thead><tr><th>Article</th><th className="hide-mobile">Déposant</th><th className="hide-mobile">État</th><th>Statut</th><th className="hide-mobile">Commission</th><th style={{textAlign:'right'}}>Prix</th><th>QR</th><th></th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td><div style={{ fontWeight:700 }}>{a.marque} {a.modele||''}</div><div style={{ fontSize:11, color:'var(--muted)' }}>{a.type}{a.taille?` · ${a.taille}`:''}</div></td>
                  <td className="hide-mobile" style={{ color:'var(--text2)', fontSize:13 }}>{a.deposants?.prenom} {a.deposants?.nom}</td>
                  <td className="hide-mobile"><span className="badge badge-gray" style={{ fontSize:11 }}>{a.etat}</span></td>
                  <td><span className={`badge ${sB[a.statut]}`}>{sL[a.statut]}</span></td>
                  <td className="hide-mobile" style={{ fontSize:12, color:'var(--muted)' }}>{a.commission_boutique}% / {a.commission_deposant}%</td>
                  <td style={{ fontWeight:900, textAlign:'right', fontSize:14 }}>{Number(a.prix_vente).toFixed(2)} €</td>
                  <td><button onClick={()=>setShowQR(a)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:18 }}>⊞</button></td>
                  <td><button onClick={()=>setConfirmDel(a)} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--danger)', fontSize:15 }}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
