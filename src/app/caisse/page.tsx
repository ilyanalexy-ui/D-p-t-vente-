'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

type CartItem = { article: any; deposant: any }
type PendingVente = { ids: string[]; labels: string[]; total: number; timer: number }

export default function Caisse() {
  const { toast } = useToast()
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
    const { data } = await supabase.from('ventes').select('*, articles(marque,modele,type), deposants(nom,prenom)').order('created_at',{ascending:false}).limit(10)
    setVentes(data||[])
  }
  useEffect(() => { loadArticles(); loadVentes() }, [])

  useEffect(() => {
    if (!pending) return
    if (pending.timer <= 0) { setPending(null); return }
    timerRef.current = setTimeout(() => setPending(p => p ? {...p, timer:p.timer-1} : null), 1000)
    return () => clearTimeout(timerRef.current)
  }, [pending])

  const filtered = articles.filter(a => `${a.marque} ${a.modele||''} ${a.type} ${a.qr_code_id}`.toLowerCase().includes(search.toLowerCase()))

  // CA du jour calculé depuis les ventes chargées
  const today = new Date()
  const caJour = ventes.filter(v => {
    const d = new Date(v.created_at)
    return d.getDate()===today.getDate() && d.getMonth()===today.getMonth() && d.getFullYear()===today.getFullYear()
  }).reduce((s,v) => s+Number(v.prix_vente), 0)

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
    setScanError('')
    setCart(p=>[...p,{article:a,deposant:a.deposants}])
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
      if (error) { toast('Erreur lors de la vente : '+error.message, 'error'); setConfirming(false); return }
      ids.push(vd.id)
      labels.push(`${item.article.marque} ${item.article.modele||item.article.type}`)

      const dep = {...item.deposant}; const art = {...item.article}
      setTimeout(async () => {
        if (!dep?.email) return
        const { data: revs } = await supabase.from('reversements').select('montant').eq('deposant_id',dep.id).eq('statut','pending')
        const cagnotte = revs?.reduce((s:number,r:any)=>s+Number(r.montant),0)||0
        await fetch('/api/notify',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:dep.email, deposant:dep.prenom, article:`${art.marque} ${art.modele||art.type}`, cagnotte:cagnotte.toFixed(2) }) })
      }, 3*60*1000)
    }

    toast(`${carSnap.length} article${carSnap.length>1?'s':''} encaissé${carSnap.length>1?'s':''} — ${venteTotal.toFixed(2)} €`, 'success')
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
    toast('Vente annulée, article(s) remis en rayon', 'info')
    setPending(null); setCancelling(false)
    loadArticles(); loadVentes()
  }

  async function supprimerVente(vente: any) {
    await supabase.from('articles').update({statut:'en_rayon'}).eq('id',vente.article_id)
    await supabase.from('reversements').delete().eq('deposant_id',vente.deposant_id).eq('montant',vente.montant_deposant).eq('statut','pending')
    await supabase.from('ventes').delete().eq('id',vente.id)
    toast('Vente supprimée, article remis en rayon', 'info')
    setConfirmDelVente(null); loadArticles(); loadVentes()
  }

  const mins = Math.floor((pending?.timer||0)/60)
  const secs = ((pending?.timer||0)%60).toString().padStart(2,'0')
  const urgence = (pending?.timer||0) < 30

  return (
    <div className="page-content" style={{ padding:20, display:'flex', flexDirection:'column', gap:14, minHeight:'calc(100vh - 80px)' }}>

      {/* Header */}
      <div className="reveal reveal-1" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Point de vente</div>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <h1 className="font-display" style={{ fontSize:30, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1 }}>Caisse</h1>
            {caJour > 0 && (
              <div style={{ background:'var(--success-bg)', border:'1px solid var(--success)', borderRadius:20, padding:'4px 12px', fontSize:12.5, fontWeight:700, color:'var(--success)' }}>
                +{caJour.toFixed(2)} € aujourd'hui
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize:12, color:'var(--muted)', fontWeight:500 }}>{articles.length} article{articles.length!==1?'s':''} en rayon</div>
      </div>

      {/* Bandeau annulation */}
      {pending && (
        <div className="reveal reveal-1" style={{ background:urgence?'var(--danger-bg)':'var(--warning-bg)', border:`1.5px solid ${urgence?'var(--danger)':'var(--warning)'}`, borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:18 }}>{urgence?'⚠️':'⏱'}</span>
          <div style={{ flex:1, minWidth:160 }}>
            <div style={{ fontWeight:700, fontSize:13.5, color:urgence?'var(--danger)':'var(--warning)', letterSpacing:'-0.01em' }}>
              Annulable encore {mins}:{secs}
            </div>
            <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{pending.labels.join(', ')} · {pending.total.toFixed(2)} €</div>
            <div style={{ height:3, background:'var(--border)', borderRadius:2, marginTop:8 }}>
              <div style={{ height:3, borderRadius:2, background:urgence?'var(--danger)':'var(--warning)', width:`${(pending.timer/180)*100}%`, transition:'width 1s linear' }}/>
            </div>
          </div>
          <button onClick={annulerPending} disabled={cancelling} style={{ padding:'9px 16px', borderRadius:9, border:`1.5px solid ${urgence?'var(--danger)':'var(--warning)'}`, background:'var(--surface)', color:urgence?'var(--danger)':'var(--warning)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0, transition:'var(--transition-fast)' }}>
            {cancelling?'…':'✕ Annuler'}
          </button>
        </div>
      )}

      {/* Layout 2 col */}
      <div className="caisse-grid reveal reveal-2" style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:14, flex:1 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Scanner */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>Scanner QR</div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <input
                value={scanInput}
                onChange={e=>setScanInput(e.target.value.toUpperCase())}
                onKeyDown={e=>e.key==='Enter'&&scanArticle(scanInput)}
                placeholder="ART-XXXXXXXX · Entrée pour scanner"
                autoFocus
                style={{ flex:1, padding:'11px 14px', background:'var(--surface2)', border:'2px solid var(--border)', borderRadius:10, fontSize:13.5, outline:'none', fontFamily:'monospace', color:'var(--text)', transition:'var(--transition-fast)' }}
              />
              <button onClick={()=>scanArticle(scanInput)} disabled={scanning||!scanInput} className="btn btn-primary" style={{ padding:'11px 18px', flexShrink:0 }}>
                {scanning ? '···' : 'OK'}
              </button>
            </div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>Douchette Bluetooth ou saisie manuelle de l'ID sous le QR code</div>
            {scanError && (
              <div style={{ marginTop:10, background:'var(--danger-bg)', border:'1px solid var(--danger)', borderRadius:9, padding:'9px 12px', fontSize:13, color:'var(--danger)', fontWeight:600 }}>
                ✕ {scanError}
              </div>
            )}
            {lastScan && (
              <div style={{ marginTop:10, background:'var(--success-bg)', border:'1px solid var(--success)', borderRadius:9, padding:'9px 12px', fontSize:13, color:'var(--success)', fontWeight:700 }}>
                ✓ {lastScan.marque} {lastScan.modele||lastScan.type} — {Number(lastScan.prix_vente).toFixed(2)} €
              </div>
            )}
          </div>

          {/* Articles en rayon */}
          <div className="card" style={{ padding:16, flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>
              Articles en rayon ({articles.length})
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{ width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', color:'var(--text)', marginBottom:10, transition:'var(--transition-fast)' }}/>
            <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:300, overflowY:'auto' }}>
              {filtered.map(a => (
                <div key={a.id} onClick={()=>addToCart(a)} style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 12px', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)', cursor:'pointer', transition:'var(--transition-fast)' }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--gold-border)')}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)')}
                >
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13, letterSpacing:'-0.01em' }}>{a.marque} {a.modele||a.type}</div>
                    <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'monospace', marginTop:1 }}>{a.qr_code_id}</div>
                  </div>
                  <span className="font-display" style={{ fontWeight:700, fontSize:14, flexShrink:0 }}>{Number(a.prix_vente).toFixed(2)} €</span>
                  <span style={{ color:'var(--gold)', fontSize:18, flexShrink:0, lineHeight:1 }}>+</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANIER */}
        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'18px 18px 14px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', color:'var(--muted)', marginBottom:4 }}>Panier</div>
            <div className="font-display" style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.02em' }}>
              {cart.length} article{cart.length!==1?'s':''}
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:10 }}>
            {cart.length===0 ? (
              <div style={{ textAlign:'center', padding:'28px 16px', color:'var(--muted)' }}>
                <div style={{ fontSize:28, marginBottom:8, opacity:0.3 }}>◯</div>
                <div style={{ fontSize:13 }}>Scannez ou cliquez un article</div>
              </div>
            ) : cart.map((item,i) => (
              <div key={item.article.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)', marginBottom:6, transition:'var(--transition-fast)' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13, letterSpacing:'-0.01em' }}>{item.article.marque} {item.article.modele||item.article.type}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:1 }}>{item.deposant?.prenom} {item.deposant?.nom}</div>
                  {item.deposant?.email && <div style={{ fontSize:10, color:'var(--success)', marginTop:1 }}>Email auto dans 3 min</div>}
                </div>
                <span className="font-display" style={{ fontWeight:700, fontSize:14, flexShrink:0 }}>{Number(item.article.prix_vente).toFixed(2)} €</span>
                <button onClick={()=>setCart(p=>p.filter((_,idx)=>idx!==i))} className="icon-btn" style={{ border:'none', background:'none', cursor:'pointer', color:'var(--danger)', fontSize:20, flexShrink:0, lineHeight:1, padding:8 }}>×</button>
              </div>
            ))}
          </div>

          <div style={{ padding:'14px 16px', borderTop:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--muted)' }}>Total</span>
              <span className="font-display" style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.03em' }}>{total.toFixed(2)} €</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              {(['cb','especes'] as const).map(m => (
                <button key={m} onClick={()=>setMethode(m)} style={{ padding:'13px 11px', borderRadius:9, border:`2px solid ${methode===m?'var(--accent)':'var(--border)'}`, background:methode===m?'var(--accent)':'var(--surface2)', color:methode===m?'var(--bg)':'var(--text)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'var(--transition-fast)' }}>
                  {m==='cb'?'💳 CB':'💵 Espèces'}
                </button>
              ))}
            </div>
            <button onClick={confirmerVente} disabled={cart.length===0||!methode||confirming} style={{ width:'100%', padding:'14px', background:cart.length>0&&methode?'var(--success)':'var(--surface2)', color:cart.length>0&&methode?'white':'var(--muted)', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:cart.length>0&&methode?'pointer':'not-allowed', fontFamily:'inherit', transition:'var(--transition-fast)', boxShadow:cart.length>0&&methode?'0 4px 16px rgba(22,163,74,0.25)':'none' }}>
              {confirming ? 'Traitement…' : `Encaisser${total>0?' '+total.toFixed(2)+' €':''}`}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sticky cart bar */}
      <div className="mobile-cart-bar" style={{
        position:'fixed', bottom:'calc(64px + env(safe-area-inset-bottom, 0px))', left:0, right:0, zIndex:90,
        background:'var(--surface)', borderTop:'1.5px solid var(--border)',
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        padding:'10px 12px', gap:8, alignItems:'center',
        boxShadow:'0 -4px 24px rgba(0,0,0,0.08)',
      }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>
            {cart.length} article{cart.length!==1?'s':''} · <span className="font-display" style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{total.toFixed(2)} €</span>
          </div>
          <div style={{ display:'flex', gap:5, marginTop:5 }}>
            {(['cb','especes'] as const).map(m => (
              <button key={m} onClick={()=>setMethode(m)} style={{ padding:'5px 10px', borderRadius:7, border:`1.5px solid ${methode===m?'var(--accent)':'var(--border)'}`, background:methode===m?'var(--accent)':'var(--surface2)', color:methode===m?'var(--bg)':'var(--text)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {m==='cb'?'💳 CB':'💵'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={confirmerVente} disabled={cart.length===0||!methode||confirming} style={{ padding:'12px 18px', background:cart.length>0&&methode?'var(--success)':'var(--surface2)', color:cart.length>0&&methode?'white':'var(--muted)', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:cart.length>0&&methode?'pointer':'not-allowed', fontFamily:'inherit', flexShrink:0, boxShadow:cart.length>0&&methode?'0 4px 16px rgba(22,163,74,0.25)':'none' }}>
          {confirming ? '…' : 'Encaisser'}
        </button>
      </div>

      {/* Modal confirm annulation vente historique */}
      {confirmDelVente && (
        <div className="modal-overlay" onClick={()=>setConfirmDelVente(null)}>
          <div className="card modal-card" style={{ padding:28, maxWidth:360, width:'100%', textAlign:'center' }} onClick={(e:any)=>e.stopPropagation()}>
            <div style={{ fontSize:38, marginBottom:14 }}>⚠️</div>
            <h2 className="font-display" style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Annuler cette vente ?</h2>
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
        <div className="card reveal reveal-3">
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--muted)' }}>Ventes récentes</div>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Article</th><th className="hide-mobile">Déposant</th><th>Paiement</th><th style={{textAlign:'right'}}>Montant</th><th></th></tr></thead>
              <tbody>
                {ventes.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight:600, letterSpacing:'-0.01em' }}>{v.articles?.marque} {v.articles?.modele||v.articles?.type}</td>
                    <td className="hide-mobile" style={{ color:'var(--text2)', fontSize:13 }}>{v.deposants?.prenom} {v.deposants?.nom}</td>
                    <td><span className={`badge ${v.methode_paiement==='cb'?'badge-gray':'badge-amber'}`}>{v.methode_paiement==='cb'?'💳 CB':'💵'}</span></td>
                    <td style={{ textAlign:'right' }}>
                      <span className="font-display" style={{ fontWeight:700, fontSize:14 }}>{Number(v.prix_vente).toFixed(2)} €</span>
                    </td>
                    <td>
                      <button onClick={()=>setConfirmDelVente(v)} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--muted)', fontSize:14, padding:4 }}>🗑</button>
                    </td>
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
