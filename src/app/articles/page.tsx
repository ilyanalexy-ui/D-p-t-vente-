'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { QrCode, Trash2, Undo2 } from 'lucide-react'

const TYPES = ['Hoodie','Sneaker','T-Shirt','Veste','Pantalon','Short','Robe','Accessoire','Autre']
const ETATS = ['Neuf avec étiquette','Excellent','Bon','Correct']

const IS: any = { width:'100%', padding:'11px 14px', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', color:'var(--text)' }
const LS: any = { display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)', marginBottom:6 }

export default function Articles() {
  const { toast } = useToast()
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
  const [confirmRecover, setConfirmRecover] = useState<any>(null)
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
    if (!form.deposant_id||!form.marque||!form.prix_vente) return toast('Déposant, marque et prix requis', 'error')
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
    setSaving(false)
    if (error) return toast('Erreur : '+error.message, 'error')
    toast('Article ajouté avec succès', 'success')
    setShowForm(false)
    setForm({ deposant_id:'', type:'Hoodie', marque:'', modele:'', taille:'', etat:'Excellent', prix_vente:'', commission_boutique:'50', commission_deposant:'50', com_b_eur:'', com_d_eur:'' })
    setSearchDep('')
    load()
  }

  async function supprimer(id: string) {
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (error) return toast('Erreur : '+error.message, 'error')
    toast('Article supprimé', 'info')
    setConfirmDel(null); load()
  }

  async function recuperer(id: string) {
    const { error } = await supabase.from('articles').update({ statut: 'recupere' }).eq('id', id)
    if (error) return toast('Erreur : '+error.message, 'error')
    toast('Article marqué comme récupéré', 'success')
    setConfirmRecover(null); load()
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

  const counts = { en_rayon: articles.filter(a=>a.statut==='en_rayon').length, vendu: articles.filter(a=>a.statut==='vendu').length, recupere: articles.filter(a=>a.statut==='recupere').length }

  return (
    <div className="page-content" style={{ padding:24 }}>

      {/* Header */}
      <div className="reveal reveal-1" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Inventaire</div>
          <h1 className="font-display" style={{ fontSize:30, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.1 }}>Articles</h1>
          <div style={{ display:'flex', gap:12, marginTop:8 }}>
            {[['en_rayon','En rayon','var(--muted)'],['vendu','Vendus','var(--success)'],['recupere','Récupérés','var(--danger)']].map(([k,l,c]:any) => (
              <span key={k} style={{ fontSize:11, fontWeight:600, color:c }}>{counts[k as keyof typeof counts]} {l.toLowerCase()}</span>
            ))}
          </div>
        </div>
        <button className="btn btn-gold reveal reveal-1" onClick={() => setShowForm(true)}>+ Ajouter un article</button>
      </div>

      {/* Filtres */}
      <div className="reveal reveal-2" style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher marque, déposant…" style={{ ...IS, maxWidth:280, flex:1 }}/>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[['tous','Tous'],['en_rayon','En rayon'],['vendu','Vendus'],['recupere','Récupérés']].map(([v,l]) => (
            <button key={v} onClick={()=>setFilterStatut(v)} style={{ padding:'9px 14px', borderRadius:9, border:'1px solid var(--border)', background:filterStatut===v?'var(--accent)':'var(--surface)', color:filterStatut===v?'var(--bg)':'var(--text2)', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'var(--transition-fast)' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Modal QR */}
      {showQR && (
        <div className="modal-overlay" onClick={()=>setShowQR(null)}>
          <div className="card modal-card" style={{ padding:28, maxWidth:300, width:'100%', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 className="font-display" style={{ fontSize:18, fontWeight:700 }}>Étiquette QR</h2>
              <button onClick={()=>setShowQR(null)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:22, color:'var(--muted)', lineHeight:1 }}>×</button>
            </div>
            <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:16 }}>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.22em', color:'#999', marginBottom:8, textTransform:'uppercase' }}>NH Dépôt-Vente</div>
              <div style={{ height:2, background:'linear-gradient(90deg,#C4952A,#E8BE5A,#C4952A)', borderRadius:1, marginBottom:16, opacity:0.6 }} />
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${showQR.qr_code_id}`} alt="QR" style={{ width:150, height:150, margin:'0 auto 12px', display:'block' }}/>
              <div style={{ fontSize:9, fontFamily:'monospace', color:'#aaa', marginBottom:10 }}>{showQR.qr_code_id}</div>
              <div style={{ fontSize:15, fontWeight:800, color:'#111', marginBottom:2, fontFamily:'Georgia,serif' }}>{showQR.marque} {showQR.modele||showQR.type}</div>
              <div style={{ fontSize:11, color:'#888', marginBottom:12 }}>{showQR.type}{showQR.taille?` · ${showQR.taille}`:''} · {showQR.etat}</div>
              <div style={{ fontSize:30, fontWeight:900, color:'#111', fontFamily:'Georgia,serif' }}>{Number(showQR.prix_vente).toFixed(2)} €</div>
            </div>
            <button onClick={() => window.print()} className="btn btn-primary" style={{ width:'100%' }}>Imprimer</button>
          </div>
        </div>
      )}

      {/* Modal confirm delete */}
      {confirmDel && (
        <div className="modal-overlay" onClick={()=>setConfirmDel(null)}>
          <div className="card modal-card" style={{ padding:28, maxWidth:360, width:'100%', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--danger-bg)', border:'1px solid var(--danger)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:22 }}>🗑</div>
            <h2 className="font-display" style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Supprimer l'article ?</h2>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{confirmDel.marque} {confirmDel.modele||confirmDel.type}</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>Cette action est irréversible.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={() => supprimer(confirmDel.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirm récupérer */}
      {confirmRecover && (
        <div className="modal-overlay" onClick={()=>setConfirmRecover(null)}>
          <div className="card modal-card" style={{ padding:28, maxWidth:360, width:'100%', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--gold-bg)', border:'1px solid var(--gold-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:22 }}>↩</div>
            <h2 className="font-display" style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Article récupéré ?</h2>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{confirmRecover.marque} {confirmRecover.modele||confirmRecover.type}</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>L'article sera retiré du rayon et marqué récupéré par le déposant.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmRecover(null)}>Annuler</button>
              <button className="btn btn-gold" onClick={() => recuperer(confirmRecover.id)}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout article */}
      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="card modal-card" style={{ width:'100%', maxWidth:520, padding:28, margin:'auto', maxHeight:'92vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h2 className="font-display" style={{ fontSize:22, fontWeight:700 }}>Nouvel article</h2>
              <button onClick={() => setShowForm(false)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:22, color:'var(--muted)', lineHeight:1 }}>×</button>
            </div>

            {/* Déposant */}
            <div style={{ marginBottom:16 }}>
              <label style={LS}>Déposant *</label>
              <input value={searchDep} onChange={e=>setSearchDep(e.target.value)} placeholder="Rechercher un déposant…" style={{ ...IS, marginBottom:6 }}/>
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
              {form.deposant_id && (
                <div style={{ fontSize:12, color:'var(--success)', marginTop:5, fontWeight:600 }}>✓ Déposant sélectionné</div>
              )}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div><label style={LS}>Type</label><select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={IS}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div><label style={LS}>Marque *</label><input value={form.marque} onChange={e=>setForm(p=>({...p,marque:e.target.value}))} placeholder="Nike, Adidas…" style={IS}/></div>
              <div><label style={LS}>Modèle</label><input value={form.modele} onChange={e=>setForm(p=>({...p,modele:e.target.value}))} placeholder="Air Jordan…" style={IS}/></div>
              <div><label style={LS}>Taille</label><input value={form.taille} onChange={e=>setForm(p=>({...p,taille:e.target.value}))} placeholder="M, 40, US 10…" style={IS}/></div>
              <div><label style={LS}>État</label><select value={form.etat} onChange={e=>setForm(p=>({...p,etat:e.target.value}))} style={IS}>{ETATS.map(e=><option key={e}>{e}</option>)}</select></div>
              <div><label style={LS}>Prix de vente (€) *</label><input type="number" value={form.prix_vente} onChange={e=>setForm(p=>({...p,prix_vente:e.target.value}))} placeholder="0.00" style={IS}/></div>
            </div>

            {/* Commission */}
            <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)' }}>Partage commission</div>
                <div style={{ display:'flex', gap:5 }}>
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

            <button onClick={save} disabled={saving} className="btn btn-primary" style={{ width:'100%', padding:'14px', fontSize:14 }}>
              {saving ? 'Enregistrement…' : '+ Ajouter & Générer QR Code'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>
          <div style={{ fontSize:24, opacity:0.3, marginBottom:12 }}>···</div>
          Chargement…
        </div>
      ) : filtered.length===0 ? (
        <div className="card reveal reveal-3" style={{ padding:60, textAlign:'center', color:'var(--muted)' }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.3 }}>⌀</div>
          <div className="font-display" style={{ fontWeight:600, fontSize:16, color:'var(--text2)', marginBottom:6 }}>Aucun article</div>
          <div style={{ fontSize:13 }}>Modifiez vos filtres ou ajoutez un article</div>
        </div>
      ) : (
        <div className="card reveal reveal-3 table-scroll" style={{ overflow:'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Article</th>
                <th className="hide-mobile">Déposant</th>
                <th className="hide-mobile">État</th>
                <th>Statut</th>
                <th className="hide-mobile">Commission</th>
                <th style={{textAlign:'right'}}>Prix</th>
                <th style={{textAlign:'center'}}>QR</th>
                <th style={{textAlign:'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="article-name-cell" style={{ fontWeight:600, letterSpacing:'-0.01em' }}>{a.marque} {a.modele||''}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:1 }}>{a.type}{a.taille?` · ${a.taille}`:''}</div>
                  </td>
                  <td className="hide-mobile" style={{ color:'var(--text2)', fontSize:13 }}>{a.deposants?.prenom} {a.deposants?.nom}</td>
                  <td className="hide-mobile"><span className="badge badge-gray" style={{ fontSize:10.5 }}>{a.etat}</span></td>
                  <td><span className={`badge ${sB[a.statut]}`}>{sL[a.statut]}</span></td>
                  <td className="hide-mobile" style={{ fontSize:12, color:'var(--muted)' }}>{a.commission_boutique}% / {a.commission_deposant}%</td>
                  <td style={{ textAlign:'right' }}>
                    <span className="font-display" style={{ fontWeight:700, fontSize:14 }}>{Number(a.prix_vente).toFixed(2)} €</span>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <button onClick={()=>setShowQR(a)} title="Voir QR Code" className="icon-btn" style={{ border:'none', background:'none', cursor:'pointer', color:'var(--muted)' }}>
                      <QrCode size={16} />
                    </button>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0 }}>
                      {a.statut==='en_rayon' && (
                        <button onClick={()=>setConfirmRecover(a)} title="Marquer récupéré" className="icon-btn" style={{ border:'none', background:'none', cursor:'pointer', color:'var(--gold)' }}>
                          <Undo2 size={14} />
                        </button>
                      )}
                      <button onClick={()=>setConfirmDel(a)} title="Supprimer" className="icon-btn" style={{ border:'none', background:'none', cursor:'pointer', color:'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
