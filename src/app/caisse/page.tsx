'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type CartItem = { article: any; deposant: any }
type PendingVente = { ids: string[]; labels: string[]; total: number; timer: number }

export default function Caisse() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [scanInput, setScanInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [methode, setMethode] = useState<'cb'|'especes'|null>(null)
  const [confirming, setConfirming] = useState(false)
  const [lastScan, setLastScan] = useState<any>(null)
  const [scanError, setScanError] = useState('')
  const [articles, setArticles] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [ventes, setVentes] = useState<any[]>([])
  const [confirmDelVente, setConfirmDelVente] = useState<any>(null)
  const [pending, setPending] = useState<PendingVente|null>(null)
  const [cancelling, setCancelling] = useState(false)
  const timerRef = useRef<any>(null)

  const total = cart.reduce((s,i) => s + Number(i.article.prix_vente), 0)

  async function loadArticles() {
    const { data } = await supabase.from('articles').select('*, deposants(id,nom,prenom,email)').eq('statut','en_rayon').order('created_at',{ascending:false})
    setArticles(data||[])
  }
  async function loadVentes() {
    const { data } = await supabase.from('ventes').select('*, articles(marque,modele,type), deposants(nom,prenom)').order('created_at',{ascending:false}).limit(8)
    setVentes(data||[])
  }
  useEffect(() => { loadArticles(); loadVentes() }, [])

  // Countdown
  useEffect(() => {
    if (!pending) return
    if (pending.timer <= 0) { setPending(null); return }
    timerRef.current = setTimeout(() => setPending(p => p ? {...p, timer:p.timer-1} : null), 1000)
    return () => clearTimeout(timerRef.current)
  }, [pending])

  const filtered = articles.filter(a => `${a.marque} ${a.modele||''} ${a.type} ${a.qr_code_id}`.toLowerCase().includes(search.toLowerCase()))

  async function scanArticle(qrId: string) {
    if (!qrId.trim()) return
    setScanError(''); setScanning(true)
    const { data, error } = await supabase.from('articles').select('*, deposants(id,nom,prenom,email)').eq('qr_code_id',qrId.trim().toUpperCase()).single()
    setScanning(false)
    if (error||!data) { setScanError(`QR introuvable : ${qrId}`); setScanInput(''); return }
    if (data.statut!=='en_rayon') { setScanError(`Article déjà ${data.statut}`); setScanInput(''); return }
    if (cart.find(i=>i.article.id===data.id)) { setScanError('Déjà dans le panier'); setScanInput(''); return }
    setLastScan(data); setCart(p=>[...p,{article:data,deposant:data.deposants}]); setScanInput('')
    setTimeout(()=>setLastScan(null),3000)
  }

  function addToCart(a: any) {
    if (cart.find(i=>i.article.id===a.id)) { setScanError('Déjà dans le panier'); return }
    setScanError(''); setCart(p=>[...p,{article:a,deposant:a.deposants}])
    setLastScan(a); setTimeout(()=>setLastScan(null),2000)
  }

  async function confirmerVente() {
    if (cart.length===0||!methode) return
    setConfirming(true)
    clearTimeout(timerRef.current)

    const ids: string[] = []
    const labels: string[] = []
    const venteTotal = total
    const carSnap = [...cart]

    for (const item of carSnap) {
      const { data: vd, error } = await supabase.from('ventes').insert([{
        article_id:item.article.id, deposant_id:item.deposant.id,
        prix_vente:item.article.prix_vente, montant_boutique:item.article.montant_boutique,
        montant_deposant:item.article.montant_deposant, methode_paiement:methode,
      }]).select().single()
      if (error) { alert('Erreur : '+error.message); setConfirming(false); return }
      ids.push(vd.id)
      labels.push(`${item.article.marque} ${item.article.modele||item.article.type}`)

      // Email après 3 min
      const dep = {...item.deposant}; const art = {...item.article}
      setTimeout(async () => {
        if (!dep?.email) return
        const { data: revs } = await supabase.from('reversements').select('montant').eq('deposant_id',dep.id).eq('statut','pending')
        const cagnotte = revs?.reduce((s:number,r:any)=>s+Number(r.montant),0)||0
        await fetch('/api/notify',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:dep.email, deposant:dep.prenom, article:`${art.marque} ${art.modele||art.type}`, cagnotte:cagnotte.toFixed(2) }) })
      }, 3*60*1000)
    }

    setPending({ ids, labels, total:venteTotal, timer:180 })
    setCart([]); setMethode(null); setConfirming(false)
    loadArticles(); loadVentes()
  }

  async function annulerPending() {
    if (!pending) return
    setCancelling(true)
    clearTimeout(timerRef.current)
    for (const id of pending.ids) {
      const { data: v } = await supabase.from('ventes').select('article_id,deposant_id,montant_deposant').eq('id',id).single()
      if (v) {
        await supabase.from('articles').update({statut:'en_rayon'}).eq('id',v.article_id)
        await supabase.from('reversements').delete().eq('deposant_id',v.deposant_id).eq('montant',v.montant_deposant).eq('statut','pending')
      }
      await supabase.from('ventes').delete().eq('id',id)
    }
    setPending(null); setCancelling(false)
    loadArticles(); loadVentes()
  }

  async function supprimerVente(vente: any) {
    await supabase.from('articles').update({statut:'en_rayon'}).eq('id',vente.article_id)
    await supabase.from('reversements').delete().eq('deposant_id',vente.deposant_id).eq('montant',vente.montant_deposant).eq('statut','pending')
    await supabase.from('ventes').delete().eq('id',vente.id)
    setConfirmDelVente(null); loadArticles(); loadVentes()
  }

  const mins = Math.floor((pending?.timer||0)/60)
  const secs = ((pending?.timer||0)%60).toString().padStart(2,'0')
  const urgence = (pending?.timer||0) < 30

  return (
    <div className="page-content" style={{ padding:16, display:'flex', flexDirection:'column', gap:14, minHeight:'calc(100vh - 80px)' }}>
      <h1 style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.03em' }}>🛒 Caisse</h1>

      {/* COUNTDOWN BANDEAU */}
      {pending && (
        <div style={{ background:urgence?'var(--danger-bg)':'var(--warning-bg)', border:`1.5px solid ${urgence?'var(--danger)':'var(--warning)'}`, borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:20 }}>{urgence?'⚠️':'⏱️'}</span>
          <div style={{ flex:1, minWidth:160 }}>
            <div style={{ fontWeight:800, fontSize:13.5, color:urgence?'var(--danger)':'var(--warning)' }}>
              Annulable encore {mins}:{secs}
            </div>
            <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{pending.labels.join(', ')} · {pending.total.toFixed(2)} €</div>
            <div style={{ height:4, background:'var(--border)', borderRadius:2, marginTop:8 }}>
              <div style={{ height:4, borderRadius:2, background:urgence?'var(--danger)':'var(--warning)', width:`${(pending.timer/180)*100}%`, transition:'width 1s linear' }}/>
            </div>
          </div>
          <button onClick={annulerPending} disabled={cancelling} style={{ padding:'9px 16px', borderRadius:9, border:`1.5px solid ${urgence?'var(--danger)':'var(--warning)'}`, background:'var(--surface)', color:urgence?'var(--danger)':'var(--warning)', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
            {cancelling?'…':'✕ Annuler'}
          </button>
        </div>
      )}

      {/* LAYOUT — desktop: 2 col, mobile: 1 col */}
      <div className="caisse-grid" style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:14, flex:1 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Scanner */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>🔍 Scanner</div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <input value={scanInput} onChange={e=>setScanInput(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&scanArticle(scanInput)} placeholder="ID QR — ART-XXXXXXXX" autoFocus style={{ flex:1, padding:'11px 13px', background:'var(--surface2)', border:'2px solid var(--border)', borderRadius:10, fontSize:13.5, outline:'none', fontFamily:'monospace', color:'var(--text)' }}/>
              <button onClick={()=>scanArticle(scanInput)} disabled={scanning||!scanInput} className="btn btn-primary" style={{ padding:'11px 16px' }}>{scanning?'…':'OK'}</button>
            </div>
            <div style={{ fontSize:11.5, color:'var(--muted)' }}>💡 Douchette Bluetooth · ou tape l'ID affiché sous le QR code</div>
            {scanError && <div style={{ marginTop:10, background:'var(--danger-bg)', border:'1px solid var(--danger)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--danger)', fontWeight:600 }}>⚠ {scanError}</div>}
            {lastScan && <div style={{ marginTop:10, background:'var(--success-bg)', border:'1px solid var(--success)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--success)', fontWeight:700 }}>✓ {lastScan.marque} {lastScan.modele||lastScan.type} — {Number(lastScan.prix_vente).toFixed(2)} €</div>}
          </div>

          {/* Articles */}
          <div className="card" style={{ padding:16, flex:1 }}>
            <div style={{ fontWeight:700, fontSize:13.5, marginBottom:10 }}>🏷️ Articles en rayon ({articles.length})</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{ width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit', color:'var(--text)', marginBottom:10 }}/>
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:300, overflowY:'auto' }}>
              {filtered.map(a => (
                <div key={a.id} onClick={()=>addToCart(a)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)', cursor:'pointer' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--border)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='var(--surface2)')}
                >
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>{a.marque} {a.modele||a.type}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'monospace' }}>{a.qr_code_id}</div>
                  </div>
                  <div style={{ fontWeight:900, fontSize:13.5 }}>{Number(a.prix_vente).toFixed(2)} €</div>
                  <span style={{ color:'var(--muted)', fontSize:18 }}>+</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANIER */}
        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--muted)', marginBottom:3 }}>Panier</div>
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.03em' }}>{cart.length} article{cart.length>1?'s':''}</div>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:10 }}>
            {cart.length===0 ? (
              <div style={{ textAlign:'center', padding:'30px 16px', color:'var(--muted)' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🛒</div>
                <div style={{ fontSize:13 }}>Scanner pour commencer</div>
              </div>
            ) : cart.map((item,i) => (
              <div key={item.article.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)', marginBottom:6 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{item.article.marque} {item.article.modele||item.article.type}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{item.deposant?.prenom} {item.deposant?.nom}</div>
                  {item.deposant?.email && <div style={{ fontSize:10, color:'var(--success)' }}>📧 Email auto</div>}
                </div>
                <div style={{ fontWeight:900, fontSize:13.5, flexShrink:0 }}>{Number(item.article.prix_vente).toFixed(2)} €</div>
                <button onClick={()=>setCart(p=>p.filter((_,idx)=>idx!==i))} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--danger)', fontSize:18, flexShrink:0 }}>×</button>
              </div>
            ))}
          </div>

          <div style={{ padding:'14px 16px', borderTop:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', color:'var(--muted)' }}>Total</span>
              <span style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.04em' }}>{total.toFixed(2)} €</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              {(['cb','especes'] as const).map(m => (
                <button key={m} onClick={()=>setMethode(m)} style={{ padding:'11px', borderRadius:9, border:`2px solid ${methode===m?'var(--accent)':'var(--border)'}`, background:methode===m?'var(--accent)':'var(--surface2)', color:methode===m?'var(--bg)':'var(--text)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  {m==='cb'?'💳 CB':'💵 Espèces'}
                </button>
              ))}
            </div>
            <button onClick={confirmerVente} disabled={cart.length===0||!methode||confirming} style={{ width:'100%', padding:'14px', background:cart.length>0&&methode?'#16A34A':'var(--surface2)', color:cart.length>0&&methode?'white':'var(--muted)', border:'none', borderRadius:10, fontSize:14, fontWeight:800, cursor:cart.length>0&&methode?'pointer':'not-allowed', fontFamily:'inherit' }}>
              {confirming?'Traitement…':`Encaisser ${total>0?total.toFixed(2)+' €':''}`}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm annulation vente historique */}
      {confirmDelVente && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card" style={{ padding:28, maxWidth:360, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:14 }}>⚠️</div>
            <div style={{ fontSize:17, fontWeight:800, marginBottom:8 }}>Annuler cette vente ?</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>L'article sera remis en rayon.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn btn-ghost" onClick={()=>setConfirmDelVente(null)}>Fermer</button>
              <button className="btn btn-danger" onClick={()=>supprimerVente(confirmDelVente)}>Annuler la vente</button>
            </div>
          </div>
        </div>
      )}

      {/* Historique */}
      {ventes.length>0 && (
        <div className="card">
          <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', fontWeight:700, fontSize:13 }}>Ventes récentes</div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Article</th><th className="hide-mobile">Déposant</th><th>Paiement</th><th style={{textAlign:'right'}}>Total</th><th></th></tr></thead>
              <tbody>
                {ventes.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight:600 }}>{v.articles?.marque} {v.articles?.modele||v.articles?.type}</td>
                    <td className="hide-mobile" style={{ color:'var(--text2)' }}>{v.deposants?.prenom} {v.deposants?.nom}</td>
                    <td><span className={`badge ${v.methode_paiement==='cb'?'badge-gray':'badge-amber'}`}>{v.methode_paiement==='cb'?'💳':'💵'}</span></td>
                    <td style={{ fontWeight:800, textAlign:'right' }}>{Number(v.prix_vente).toFixed(2)} €</td>
                    <td><button onClick={()=>setConfirmDelVente(v)} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--danger)', fontSize:14 }}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
