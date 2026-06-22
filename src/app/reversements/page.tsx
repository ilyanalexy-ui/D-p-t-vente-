'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Copy, Check } from 'lucide-react'

export default function Reversements() {
  const { toast } = useToast()
  const [pending, setPending] = useState<any[]>([])
  const [paid, setPaid] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending'|'paid'>('pending')
  const [paying, setPaying] = useState<string|null>(null)
  const [copiedIban, setCopiedIban] = useState<string|null>(null)

  async function load() {
    const { data } = await supabase.from('reversements').select('*, deposants(nom,prenom,iban,email)').order('created_at',{ascending:false})
    setPending(data?.filter(r=>r.statut==='pending')||[])
    setPaid(data?.filter(r=>r.statut==='paid')||[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function marquerPayeTout(deposantId: string, ids: string[]) {
    setPaying(deposantId)
    for (const id of ids) {
      await supabase.from('reversements').update({ statut:'paid', paid_at:new Date().toISOString() }).eq('id',id)
    }
    toast('Reversement marqué comme payé', 'success')
    setPaying(null); load()
  }

  function copyIban(iban: string, key: string) {
    navigator.clipboard.writeText(iban).then(() => {
      toast('IBAN copié dans le presse-papier', 'success')
      setCopiedIban(key)
      setTimeout(() => setCopiedIban(null), 2000)
    })
  }

  const totalPending = pending.reduce((s,r)=>s+Number(r.montant),0)
  const totalPaid = paid.reduce((s,r)=>s+Number(r.montant),0)

  const grouped = pending.reduce((acc:any,r) => {
    if (!acc[r.deposant_id]) acc[r.deposant_id] = { deposant:r.deposants, reversements:[], total:0 }
    acc[r.deposant_id].reversements.push(r)
    acc[r.deposant_id].total += Number(r.montant)
    return acc
  }, {})

  return (
    <div className="page-content" style={{ padding:24 }}>

      {/* Header */}
      <div className="reveal reveal-1" style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Finance</div>
        <h1 className="font-display" style={{ fontSize:30, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.1 }}>Reversements</h1>
        <p style={{ fontSize:12, color:'var(--muted)', marginTop:6 }}>Cagnottes à reverser aux déposants</p>
      </div>

      {/* KPIs */}
      <div className="reveal reveal-2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:12, marginBottom:24 }}>
        <div className="card" style={{ padding:22 }}>
          <div style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--muted)', marginBottom:12 }}>À reverser</div>
          <div className="font-display" style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.02em', color:totalPending>0?'var(--warning)':'var(--success)', lineHeight:1, marginBottom:5 }}>
            {totalPending.toFixed(2)} €
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', fontWeight:500 }}>
            {Object.keys(grouped).length} déposant{Object.keys(grouped).length!==1?'s':''} · {pending.length} vente{pending.length!==1?'s':''}
          </div>
        </div>
        <div className="card" style={{ padding:22 }}>
          <div style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--muted)', marginBottom:12 }}>Déjà reversé</div>
          <div className="font-display" style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.02em', color:'var(--success)', lineHeight:1, marginBottom:5 }}>
            {totalPaid.toFixed(2)} €
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', fontWeight:500 }}>{paid.length} paiement{paid.length!==1?'s':''}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="reveal reveal-3" style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['pending',`⏳ À payer (${Object.keys(grouped).length})`],['paid','✓ Historique']].map(([v,l]) => (
          <button key={v} onClick={()=>setTab(v as any)} style={{ padding:'9px 18px', borderRadius:9, border:'1px solid var(--border)', background:tab===v?'var(--accent)':'var(--surface)', color:tab===v?'var(--bg)':'var(--text2)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'var(--transition-fast)' }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>
          <div style={{ fontSize:24, opacity:0.3, marginBottom:12 }}>···</div>
          Chargement…
        </div>
      ) : tab==='pending' ? (
        Object.keys(grouped).length===0 ? (
          <div className="card reveal reveal-4" style={{ padding:60, textAlign:'center', color:'var(--muted)' }}>
            <div style={{ fontSize:28, marginBottom:14, opacity:0.35 }}>✓</div>
            <div className="font-display" style={{ fontWeight:600, fontSize:18, color:'var(--text2)', marginBottom:6 }}>Tout est à jour !</div>
            <div style={{ fontSize:13 }}>Aucun reversement en attente</div>
          </div>
        ) : (
          <div className="reveal reveal-4" style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {Object.values(grouped).map((g:any) => (
              <div key={g.deposant?.id} className="card" style={{ padding:22 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16, flexWrap:'wrap' }}>
                  <div className="font-display" style={{ width:46, height:46, borderRadius:'50%', background:'var(--gold-bg)', border:'1px solid var(--gold-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:700, color:'var(--gold)', flexShrink:0 }}>
                    {g.deposant?.prenom?.[0]}{g.deposant?.nom?.[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, letterSpacing:'-0.01em' }}>{g.deposant?.prenom} {g.deposant?.nom}</div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginTop:3, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span>{g.reversements.length} vente{g.reversements.length!==1?'s':''}</span>
                      {g.deposant?.iban ? (
                        <button onClick={() => copyIban(g.deposant.iban, g.deposant?.id)} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:7, padding:'3px 8px', cursor:'pointer', fontFamily:'monospace', fontSize:11, color:'var(--text2)', transition:'var(--transition-fast)' }}>
                          {copiedIban===g.deposant?.id ? <Check size={11} style={{ color:'var(--success)' }} /> : <Copy size={11} style={{ opacity:0.5 }} />}
                          {g.deposant.iban.slice(0,14)}…
                        </button>
                      ) : (
                        <span style={{ color:'var(--danger)', fontSize:11 }}>⚠ Pas d'IBAN</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div className="font-display" style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.02em', color:'var(--warning)', lineHeight:1 }}>
                      {g.total.toFixed(2)} €
                    </div>
                    <button onClick={()=>marquerPayeTout(g.reversements[0]?.deposant_id, g.reversements.map((r:any)=>r.id))} disabled={paying!==null} className="btn btn-success" style={{ marginTop:10, padding:'8px 16px', fontSize:12 }}>
                      {paying===g.reversements[0]?.deposant_id ? '···' : '✓ Marquer payé'}
                    </button>
                  </div>
                </div>
                <div style={{ background:'var(--surface2)', borderRadius:10, overflow:'hidden', border:'1px solid var(--border)' }}>
                  {g.reversements.map((r:any,i:number) => (
                    <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 14px', borderBottom:i<g.reversements.length-1?'1px solid var(--border)':'none' }}>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>
                        {new Date(r.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                      </div>
                      <div className="font-display" style={{ fontWeight:700, fontSize:13 }}>{Number(r.montant).toFixed(2)} €</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card reveal reveal-4 table-scroll" style={{ overflow:'hidden' }}>
          {paid.length===0 ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--muted)' }}>
              <div style={{ opacity:0.3, marginBottom:10, fontSize:24 }}>⌀</div>
              Aucun paiement effectué
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Déposant</th>
                  <th>Montant</th>
                  <th className="hide-mobile">Payé le</th>
                </tr>
              </thead>
              <tbody>
                {paid.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight:600, letterSpacing:'-0.01em' }}>{r.deposants?.prenom} {r.deposants?.nom}</td>
                    <td>
                      <span className="font-display" style={{ fontWeight:700, fontSize:14, color:'var(--success)' }}>{Number(r.montant).toFixed(2)} €</span>
                    </td>
                    <td className="hide-mobile" style={{ color:'var(--muted)', fontSize:12.5 }}>
                      {r.paid_at ? new Date(r.paid_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
