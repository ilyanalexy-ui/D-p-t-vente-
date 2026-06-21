'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Pencil, Trash2, Copy, Check } from 'lucide-react'

const IS: any = { width:'100%', padding:'11px 14px', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', color:'var(--text)' }
const LS: any = { display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)', marginBottom:6 }

export default function Deposants() {
  const { toast } = useToast()
  const [deposants, setDeposants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmDel, setConfirmDel] = useState<any>(null)
  const [copiedId, setCopiedId] = useState<string|null>(null)
  const [form, setForm] = useState({ nom:'', prenom:'', telephone:'', email:'', iban:'', notes:'' })
  const [editForm, setEditForm] = useState<any>(null)

  async function load() {
    const { data } = await supabase.from('vue_deposants_stats').select('*').order('nom')
    setDeposants(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save() {
    if (!form.nom || !form.prenom) return toast('Nom et prénom requis', 'error')
    setSaving(true)
    const { error } = await supabase.from('deposants').insert([form])
    setSaving(false)
    if (error) return toast('Erreur : ' + error.message, 'error')
    toast(`${form.prenom} ${form.nom} ajouté(e)`, 'success')
    setForm({ nom:'', prenom:'', telephone:'', email:'', iban:'', notes:'' })
    setShowForm(false); load()
  }

  function openEdit(d: any) {
    setEditForm({ id:d.id, nom:d.nom||'', prenom:d.prenom||'', telephone:d.telephone||'', email:d.email||'', iban:d.iban||'', notes:d.notes||'' })
    setShowEdit(true)
  }

  async function saveEdit() {
    if (!editForm.nom || !editForm.prenom) return toast('Nom et prénom requis', 'error')
    setSaving(true)
    const { error } = await supabase.from('deposants').update({
      nom: editForm.nom, prenom: editForm.prenom,
      telephone: editForm.telephone || null, email: editForm.email || null,
      iban: editForm.iban || null, notes: editForm.notes || null,
    }).eq('id', editForm.id)
    setSaving(false)
    if (error) return toast('Erreur : ' + error.message, 'error')
    toast('Déposant mis à jour', 'success')
    setShowEdit(false); load()
  }

  async function supprimer(id: string) {
    const { error } = await supabase.from('deposants').delete().eq('id', id)
    if (error) return toast('Erreur : ' + error.message, 'error')
    toast('Déposant supprimé', 'info')
    setConfirmDel(null); load()
  }

  function copyIban(iban: string, id: string) {
    navigator.clipboard.writeText(iban).then(() => {
      toast('IBAN copié dans le presse-papier', 'success')
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const filtered = deposants.filter(d => `${d.nom} ${d.prenom} ${d.email||''} ${d.telephone||''}`.toLowerCase().includes(search.toLowerCase()))

  const FormModal = ({ title, data, setData, onSave, onClose }: any) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-card" style={{ width:'100%', maxWidth:480, padding:28, margin:'auto' }} onClick={(e:any)=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h2 className="font-display" style={{ fontSize:22, fontWeight:700 }}>{title}</h2>
          <button onClick={onClose} style={{ border:'none', background:'none', cursor:'pointer', fontSize:22, color:'var(--muted)', lineHeight:1 }}>×</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div><label style={LS}>Prénom *</label><input value={data.prenom} onChange={e=>setData((p:any)=>({...p,prenom:e.target.value}))} placeholder="Marie" style={IS}/></div>
          <div><label style={LS}>Nom *</label><input value={data.nom} onChange={e=>setData((p:any)=>({...p,nom:e.target.value}))} placeholder="Martin" style={IS}/></div>
        </div>
        {[
          ['Téléphone','telephone','06 12 34 56 78','tel'],
          ['Email','email','marie@email.fr','email'],
          ['IBAN','iban','FR76 3000 1007 9412 3456 7890 185','text'],
          ['Notes','notes','Infos complémentaires…','text'],
        ].map(([l,k,p,t]) => (
          <div key={k} style={{ marginBottom:14 }}>
            <label style={LS}>{l}</label>
            <input type={t} value={data[k]} onChange={(e:any)=>setData((prev:any)=>({...prev,[k]:e.target.value}))} placeholder={p} style={IS}/>
          </div>
        ))}
        <button onClick={onSave} disabled={saving} className="btn btn-primary" style={{ width:'100%', padding:'13px', marginTop:8, fontSize:14 }}>
          {saving ? 'Enregistrement…' : title === 'Nouveau déposant' ? 'Créer le déposant' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="page-content" style={{ padding:24 }}>

      {/* Header */}
      <div className="reveal reveal-1" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Annuaire</div>
          <h1 className="font-display" style={{ fontSize:30, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.1 }}>Déposants</h1>
          <p style={{ fontSize:12, color:'var(--muted)', marginTop:6 }}>{deposants.length} déposant{deposants.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-gold reveal reveal-1" onClick={() => setShowForm(true)}>+ Nouveau déposant</button>
      </div>

      {/* Search */}
      <div className="reveal reveal-2" style={{ marginBottom:20 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher nom, email, téléphone…" style={{ ...IS, maxWidth:360 }}/>
      </div>

      {/* Confirm delete */}
      {confirmDel && (
        <div className="modal-overlay" onClick={()=>setConfirmDel(null)}>
          <div className="card modal-card" style={{ padding:28, maxWidth:360, width:'100%', textAlign:'center' }} onClick={(e:any)=>e.stopPropagation()}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--danger-bg)', border:'1px solid var(--danger)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Trash2 size={22} style={{ color:'var(--danger)' }} />
            </div>
            <h2 className="font-display" style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Supprimer {confirmDel.prenom} ?</h2>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>Tous les articles et données associés seront perdus.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={() => supprimer(confirmDel.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Form nouveau déposant */}
      {showForm && <FormModal title="Nouveau déposant" data={form} setData={setForm} onSave={save} onClose={()=>setShowForm(false)} />}

      {/* Form édition déposant */}
      {showEdit && editForm && <FormModal title="Modifier le déposant" data={editForm} setData={setEditForm} onSave={saveEdit} onClose={()=>setShowEdit(false)} />}

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>
          <div style={{ fontSize:24, opacity:0.3, marginBottom:12 }}>···</div>
          Chargement…
        </div>
      ) : filtered.length===0 ? (
        <div className="card reveal reveal-3" style={{ padding:60, textAlign:'center', color:'var(--muted)' }}>
          <div style={{ fontSize:32, opacity:0.3, marginBottom:12 }}>⌀</div>
          <div className="font-display" style={{ fontWeight:600, fontSize:16, color:'var(--text2)' }}>Aucun déposant</div>
        </div>
      ) : (
        <div className="reveal reveal-3" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14 }}>
          {filtered.map(d => (
            <div key={d.id} className="card" style={{ padding:20 }}>
              {/* Card header */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
                <div className="font-display" style={{ width:44, height:44, borderRadius:'50%', background:'var(--gold-bg)', border:'1px solid var(--gold-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'var(--gold)', flexShrink:0, letterSpacing:'-0.01em' }}>
                  {d.prenom?.[0]}{d.nom?.[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, letterSpacing:'-0.01em' }}>{d.prenom} {d.nom}</div>
                  {d.telephone && <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:1 }}>{d.telephone}</div>}
                </div>
                <div style={{ display:'flex', gap:2, flexShrink:0 }}>
                  <button onClick={() => openEdit(d)} title="Modifier" style={{ border:'none', background:'none', cursor:'pointer', color:'var(--muted)', padding:5, display:'inline-flex', transition:'var(--transition-fast)' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDel(d)} title="Supprimer" style={{ border:'none', background:'none', cursor:'pointer', color:'var(--muted)', padding:5, display:'inline-flex', transition:'var(--transition-fast)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:d.email || d.iban ? 12 : 0 }}>
                {[
                  { label:'Rayon', value:d.articles_en_rayon||0, color:'var(--muted)' },
                  { label:'Vendus', value:d.articles_vendus||0, color:'var(--success)' },
                  { label:'Cagnotte', value:`${Number(d.cagnotte_a_reverser||0).toFixed(0)} €`, color:Number(d.cagnotte_a_reverser)>0?'var(--warning)':'var(--muted)' },
                ].map(s => (
                  <div key={s.label} style={{ background:'var(--surface2)', borderRadius:9, padding:'9px 8px', textAlign:'center', border:'1px solid var(--border)' }}>
                    <div className="font-display" style={{ fontSize:17, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:9.5, color:'var(--muted)', marginTop:4, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Contact + IBAN */}
              {(d.email || d.iban) && (
                <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:6 }}>
                  {d.email && (
                    <div style={{ fontSize:12, color:'var(--muted)', display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ opacity:0.6 }}>@</span> {d.email}
                    </div>
                  )}
                  {d.iban && (
                    <button onClick={() => copyIban(d.iban, d.id)} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'7px 10px', cursor:'pointer', fontFamily:'monospace', fontSize:11, color:'var(--text2)', width:'100%', textAlign:'left', transition:'var(--transition-fast)' }}>
                      {copiedId===d.id ? <Check size={12} style={{ color:'var(--success)', flexShrink:0 }} /> : <Copy size={12} style={{ flexShrink:0, opacity:0.5 }} />}
                      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.iban}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Alerte cagnotte */}
              {Number(d.cagnotte_a_reverser) > 0 && (
                <div style={{ marginTop:12, background:'var(--warning-bg)', border:'1px solid var(--warning)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--warning)', fontWeight:700 }}>
                  {Number(d.cagnotte_a_reverser).toFixed(2)} € à reverser
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
