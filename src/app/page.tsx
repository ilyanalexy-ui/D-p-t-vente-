'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function getSettings() {
  if (typeof window === 'undefined') return { jour_reversement: 1 }
  try { return { jour_reversement: 1, ...JSON.parse(localStorage.getItem('dv_settings') || '{}') } } catch { return { jour_reversement: 1 } }
}

export default function Dashboard() {
  const [kpis, setKpis] = useState({ ca_jour: 0, nb_ventes_jour: 0, part_boutique_jour: 0, part_deposants_jour: 0 })
  const [kpisMois, setKpisMois] = useState({ ca_mois: 0, nb_ventes_mois: 0 })
  const [articlesCount, setArticlesCount] = useState(0)
  const [cagnottes, setCagnottes] = useState(0)
  const [ventes, setVentes] = useState<any[]>([])
  const [warnings, setWarnings] = useState<any[]>([])
  const [topArticles, setTopArticles] = useState<any[]>([])
  const [isReversementDay, setIsReversementDay] = useState(false)
  const [settings, setSettings] = useState<any>({})

  useEffect(() => {
    const s = getSettings()
    setSettings(s)
    setIsReversementDay(new Date().getDate() === s.jour_reversement)

    async function load() {
      const { data: k } = await supabase.from('vue_kpis_jour').select('*').single()
      if (k) setKpis(k)

      const debut = new Date(); debut.setDate(1); debut.setHours(0,0,0,0)
      const { data: vm } = await supabase.from('ventes').select('prix_vente').gte('created_at', debut.toISOString())
      setKpisMois({ ca_mois: vm?.reduce((s,v) => s + Number(v.prix_vente), 0) || 0, nb_ventes_mois: vm?.length || 0 })

      const { count } = await supabase.from('articles').select('*', { count:'exact', head:true }).eq('statut', 'en_rayon')
      setArticlesCount(count || 0)

      const { data: revs } = await supabase.from('reversements').select('montant').eq('statut', 'pending')
      setCagnottes(revs?.reduce((s,r) => s + Number(r.montant), 0) || 0)

      const { data: v } = await supabase.from('ventes').select('*, articles(type,marque,modele), deposants(nom,prenom)').order('created_at', { ascending:false }).limit(6)
      setVentes(v || [])

      const il30 = new Date(); il30.setDate(il30.getDate() - 30)
      const { data: rw } = await supabase.from('reversements').select('*, deposants(nom,prenom)').eq('statut','pending').lt('created_at', il30.toISOString())
      const grouped: any = {}
      rw?.forEach(r => {
        if (!grouped[r.deposant_id]) grouped[r.deposant_id] = { deposant: r.deposants, montant: 0 }
        grouped[r.deposant_id].montant += Number(r.montant)
      })
      setWarnings(Object.values(grouped))

      const { data: topV } = await supabase.from('ventes').select('articles(type)').order('created_at',{ascending:false}).limit(50)
      const types: any = {}
      topV?.forEach((v:any) => { const t = v.articles?.type||'Autre'; types[t] = (types[t]||0)+1 })
      setTopArticles(Object.entries(types).sort((a:any,b:any) => b[1]-a[1]).slice(0,4))
    }
    load()
  }, [])

  return (
    <div className="page-content" style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.03em', marginBottom:4 }}>📊 Dashboard</h1>
        <p style={{ fontSize:13, color:'var(--muted)' }}>{new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}</p>
      </div>

      {/* ALERTE JOUR DE REVERSEMENT */}
      {isReversementDay && cagnottes > 0 && (
        <div style={{ background:'var(--warning-bg)', border:'1.5px solid var(--warning)', borderRadius:12, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <span style={{ fontSize:24 }}>💸</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:14, color:'var(--warning)' }}>C'est le jour des reversements !</div>
            <div style={{ fontSize:13, color:'var(--warning)', opacity:0.8, marginTop:2 }}>
              {cagnottes.toFixed(2)} € à reverser aux déposants aujourd'hui (le {settings.jour_reversement} du mois)
            </div>
          </div>
          <Link href="/reversements" className="btn" style={{ background:'var(--warning)', color:'white', padding:'9px 16px', fontSize:13, textDecoration:'none' }}>
            Gérer les reversements →
          </Link>
        </div>
      )}

      {/* WARNINGS RETARD */}
      {warnings.length > 0 && (
        <div style={{ background:'var(--danger-bg)', border:'1px solid var(--danger)', borderRadius:12, padding:'14px 20px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:warnings.length>1?10:0 }}>
            <span style={{ fontSize:18 }}>⚠️</span>
            <span style={{ fontSize:13.5, fontWeight:700, color:'var(--danger)', flex:1 }}>
              {warnings.length} déposant(s) non payé(s) depuis +30 jours
            </span>
            <Link href="/reversements" style={{ fontSize:12, fontWeight:700, color:'var(--danger)', textDecoration:'none', border:'1px solid var(--danger)', padding:'4px 10px', borderRadius:6 }}>Voir →</Link>
          </div>
          {warnings.map((w:any,i) => (
            <div key={i} style={{ fontSize:12, color:'var(--danger)', paddingLeft:28 }}>• {w.deposant?.prenom} {w.deposant?.nom} — {w.montant.toFixed(2)} €</div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:"CA Aujourd'hui", value:`${Number(kpis.ca_jour).toFixed(2)} €`, sub:`${kpis.nb_ventes_jour} vente(s)`, color:'var(--success)', icon:'↗' },
          { label:'CA Ce mois', value:`${Number(kpisMois.ca_mois).toFixed(2)} €`, sub:`${kpisMois.nb_ventes_mois} ventes`, color:'var(--info)', icon:'📅' },
          { label:'En rayon', value:String(articlesCount), sub:'Articles', color:'#7C3AED', icon:'📦' },
          { label:'À reverser', value:`${cagnottes.toFixed(2)} €`, sub:'Cagnottes', color:'var(--warning)', icon:'💰' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding:18 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--muted)', marginBottom:10 }}>{c.label}</div>
            <div style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.03em', color:c.color, marginBottom:4 }}>{c.value}</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Stats + Top */}
      <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div className="card" style={{ padding:22 }}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:16 }}>Répartition aujourd'hui</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { label:'Part boutique', value:`${Number(kpis.part_boutique_jour).toFixed(2)} €`, color:'var(--info)' },
              { label:'Part déposants', value:`${Number(kpis.part_deposants_jour).toFixed(2)} €`, color:'var(--success)' },
              { label:'CA jour', value:`${Number(kpis.ca_jour).toFixed(2)} €`, color:'var(--text)' },
              { label:'CA mois', value:`${Number(kpisMois.ca_mois).toFixed(2)} €`, color:'var(--text)' },
            ].map(s => (
              <div key={s.label} style={{ background:'var(--surface2)', borderRadius:10, padding:'14px', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--muted)', marginBottom:6 }}>{s.label}</div>
                <div style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.02em', color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding:22 }}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:16 }}>Top catégories</div>
          {topArticles.length === 0 ? (
            <div style={{ color:'var(--muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Pas encore de ventes</div>
          ) : topArticles.map(([type, count]:any, i) => (
            <div key={type} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:24, height:24, borderRadius:6, background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'var(--muted)', flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{type}</div>
                <div style={{ height:4, background:'var(--border)', borderRadius:2 }}>
                  <div style={{ height:4, background:'var(--accent)', borderRadius:2, width:`${(count/topArticles[0][1])*100}%` }} />
                </div>
              </div>
              <div style={{ fontWeight:800, fontSize:14, flexShrink:0 }}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dernières ventes */}
      <div className="card">
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800, fontSize:14 }}>Dernières ventes</div>
          <Link href="/caisse" style={{ fontSize:12, color:'var(--info)', textDecoration:'none', fontWeight:600 }}>Caisse →</Link>
        </div>
        {ventes.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--muted)' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🛍️</div>
            <div style={{ fontWeight:700, marginBottom:6 }}>Aucune vente</div>
            <Link href="/caisse" style={{ fontSize:13, color:'var(--info)', textDecoration:'none', fontWeight:600 }}>Aller à la caisse →</Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Article</th><th className="hide-mobile">Déposant</th><th className="hide-mobile">Paiement</th><th style={{textAlign:'right'}}>Total</th></tr></thead>
              <tbody>
                {ventes.map(v => (
                  <tr key={v.id}>
                    <td><div style={{ fontWeight:700 }}>{v.articles?.marque} {v.articles?.modele||v.articles?.type}</div></td>
                    <td className="hide-mobile" style={{ color:'var(--text2)' }}>{v.deposants?.prenom} {v.deposants?.nom}</td>
                    <td className="hide-mobile"><span className={`badge ${v.methode_paiement==='cb'?'badge-gray':'badge-amber'}`}>{v.methode_paiement==='cb'?'💳 CB':'💵 Esp.'}</span></td>
                    <td style={{ fontWeight:900, textAlign:'right' }}>{Number(v.prix_vente).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
