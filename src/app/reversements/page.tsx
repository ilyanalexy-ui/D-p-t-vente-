'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Reversements() {
  const [pending, setPending] = useState<any[]>([])
  const [paid, setPaid] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending'|'paid'>('pending')
  const [paying, setPaying] = useState<string|null>(null)

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
    setPaying(null); load()
  }

  const totalPending = pending.reduce((s,r)=>s+Number(r.montant),0)

  // Grouper pending par déposant
  const grouped = pending.reduce((acc:any,r) => {
    if (!acc[r.deposant_id]) acc[r.deposant_id] = { deposant:r.deposants, reversements:[], total:0 }
    acc[r.deposant_id].reversements.push(r)
    acc[r.deposant_id].total += Number(r.montant)
    return acc
  }, {})

  return (
    <div className="page-content" style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.03em', marginBottom:4 }}>💰 Reversements</h1>
        <p style={{ fontSize:13, color:'var(--muted)' }}>Cagnottes à reverser aux déposants</p>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:12, marginBottom:24 }}>
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--muted)', marginBottom:10 }}>À reverser</div>
          <div style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.03em', color:totalPending>0?'var(--warning)':'var(--success)' }}>{totalPending.toFixed(2)} €</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{pending.length} reversement(s)</div>
        </div>
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--muted)', marginBottom:10 }}>Déjà reversé</div>
          <div style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.03em', color:'var(--success)' }}>{paid.reduce((s,r)=>s+Number(r.montant),0).toFixed(2)} €</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{paid.length} paiement(s)</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['pending','⏳ À payer'],['paid','✓ Payés']].map(([v,l]) => (
          <button key={v} onClick={()=>setTab(v as any)} style={{ padding:'9px 18px', borderRadius:9, border:'1px solid var(--border)', background:tab===v?'var(--accent)':'var(--surface)', color:tab===v?'var(--bg)':'var(--text2)', fontSize:13.5, fontWeight:600, cursor:'pointer' }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>Chargement…</div> : tab==='pending' ? (
        Object.keys(grouped).length===0 ? (
          <div className="card" style={{ padding:60, textAlign:'center', color:'var(--muted)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>Tout est à jour !</div>
            <div style={{ fontSize:13 }}>Aucun reversement en attente</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {Object.values(grouped).map((g:any) => (
              <div key={g.deposant?.id} className="card" style={{ padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14, flexWrap:'wrap' }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--accent)', color:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, flexShrink:0 }}>
                    {g.deposant?.prenom?.[0]}{g.deposant?.nom?.[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:15 }}>{g.deposant?.prenom} {g.deposant?.nom}</div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                      {g.reversements.length} vente(s) · {g.deposant?.iban ? `IBAN : ${g.deposant.iban.slice(0,14)}…` : '⚠️ Pas d\'IBAN'}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.03em', color:'var(--warning)' }}>{g.total.toFixed(2)} €</div>
                    <button onClick={()=>marquerPayeTout(g.reversements[0]?.deposant_id, g.reversements.map((r:any)=>r.id))} disabled={paying!==null} className="btn btn-success" style={{ marginTop:8, padding:'8px 14px', fontSize:12 }}>
                      {paying===g.reversements[0]?.deposant_id?'…':'✓ Marquer payé'}
                    </button>
                  </div>
                </div>
                <div style={{ background:'var(--surface2)', borderRadius:10, overflow:'hidden', border:'1px solid var(--border)' }}>
                  {g.reversements.map((r:any,i:number) => (
                    <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 14px', borderBottom:i<g.reversements.length-1?'1px solid var(--border)':'none' }}>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>⏰ {new Date(r.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                      <div style={{ fontWeight:700, fontSize:13 }}>{Number(r.montant).toFixed(2)} €</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card table-scroll" style={{ overflow:'hidden' }}>
          <table>
            <thead><tr><th>Déposant</th><th>Montant</th><th className="hide-mobile">Payé le</th></tr></thead>
            <tbody>
              {paid.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight:600 }}>{r.deposants?.prenom} {r.deposants?.nom}</td>
                  <td style={{ fontWeight:800, color:'var(--success)' }}>{Number(r.montant).toFixed(2)} €</td>
                  <td className="hide-mobile" style={{ color:'var(--muted)' }}>{r.paid_at?new Date(r.paid_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}):'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
