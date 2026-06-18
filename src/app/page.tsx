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

  const dateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="page-content" style={{ padding: 28 }}>

      {/* Header */}
      <div className="reveal reveal-1" style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
            Vue d'ensemble
          </div>
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.1 }}>
            Dashboard
          </h1>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'capitalize', paddingBottom: 4 }}>
          {dateLabel}
        </div>
      </div>

      {/* ALERTE JOUR DE REVERSEMENT */}
      {isReversementDay && cagnottes > 0 && (
        <div className="reveal reveal-2" style={{
          background: 'var(--warning-bg)',
          border: '1.5px solid var(--warning)',
          borderRadius: 14,
          padding: '16px 22px',
          marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 22 }}>💸</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--warning)', letterSpacing: '-0.01em' }}>
              C'est le jour des reversements !
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--warning)', opacity: 0.85, marginTop: 3 }}>
              {cagnottes.toFixed(2)} € à reverser aux déposants aujourd'hui (le {settings.jour_reversement} du mois)
            </div>
          </div>
          <Link href="/reversements" className="btn" style={{ background: 'var(--warning)', color: 'white', padding: '9px 16px', fontSize: 13, textDecoration: 'none' }}>
            Gérer →
          </Link>
        </div>
      )}

      {/* WARNINGS RETARD */}
      {warnings.length > 0 && (
        <div className="reveal reveal-2" style={{
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger)',
          borderRadius: 14,
          padding: '14px 22px',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: warnings.length > 1 ? 10 : 0 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--danger)', flex: 1, letterSpacing: '-0.01em' }}>
              {warnings.length} déposant(s) non payé(s) depuis +30 jours
            </span>
            <Link href="/reversements" style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', textDecoration: 'none', border: '1px solid var(--danger)', padding: '4px 10px', borderRadius: 7 }}>
              Voir →
            </Link>
          </div>
          {warnings.map((w:any, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--danger)', paddingLeft: 26, opacity: 0.85 }}>
              · {w.deposant?.prenom} {w.deposant?.nom} — {w.montant.toFixed(2)} €
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          {
            label: "CA Aujourd'hui",
            value: `${Number(kpis.ca_jour).toFixed(2)} €`,
            sub: `${kpis.nb_ventes_jour} vente${kpis.nb_ventes_jour > 1 ? 's' : ''}`,
            color: 'var(--success)',
            indicator: '#22C55E',
            delay: 'reveal-2',
          },
          {
            label: 'CA Ce mois',
            value: `${Number(kpisMois.ca_mois).toFixed(2)} €`,
            sub: `${kpisMois.nb_ventes_mois} ventes`,
            color: 'var(--info)',
            indicator: '#60A5FA',
            delay: 'reveal-3',
          },
          {
            label: 'En rayon',
            value: String(articlesCount),
            sub: 'Articles',
            color: '#7C3AED',
            indicator: '#A78BFA',
            delay: 'reveal-4',
          },
          {
            label: 'À reverser',
            value: `${cagnottes.toFixed(2)} €`,
            sub: 'Cagnottes',
            color: 'var(--warning)',
            indicator: '#F59E0B',
            delay: 'reveal-5',
          },
        ].map(c => (
          <div key={c.label} className={`card reveal ${c.delay}`} style={{ padding: '20px 20px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)' }}>
                {c.label}
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.indicator, opacity: 0.7, marginTop: 2, flexShrink: 0 }} />
            </div>
            <div className="font-display" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: c.color, marginBottom: 5, lineHeight: 1 }}>
              {c.value}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Stats + Top catégories */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card reveal reveal-3" style={{ padding: 24 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 18 }}>
            Répartition du jour
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Part boutique', value: `${Number(kpis.part_boutique_jour).toFixed(2)} €`, color: 'var(--info)' },
              { label: 'Part déposants', value: `${Number(kpis.part_deposants_jour).toFixed(2)} €`, color: 'var(--success)' },
              { label: 'CA du jour', value: `${Number(kpis.ca_jour).toFixed(2)} €`, color: 'var(--text)' },
              { label: 'CA du mois', value: `${Number(kpisMois.ca_mois).toFixed(2)} €`, color: 'var(--text)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 8 }}>
                  {s.label}
                </div>
                <div className="font-display" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: s.color, lineHeight: 1 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card reveal reveal-4" style={{ padding: 24 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 18 }}>
            Top catégories
          </div>
          {topArticles.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              Aucune vente pour l'instant
            </div>
          ) : topArticles.map(([type, count]:any, i) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 7,
                background: i === 0 ? 'var(--gold-bg)' : 'var(--surface2)',
                border: `1px solid ${i === 0 ? 'var(--gold-border)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
                color: i === 0 ? 'var(--gold)' : 'var(--muted)',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 5, letterSpacing: '-0.01em' }}>{type}</div>
                <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
                  <div style={{
                    height: 3,
                    background: i === 0
                      ? 'linear-gradient(90deg, var(--gold-dark), var(--gold))'
                      : 'var(--text2)',
                    borderRadius: 2,
                    width: `${(count / topArticles[0][1]) * 100}%`,
                    opacity: i === 0 ? 1 : 0.35 + (0.65 * (1 - i / topArticles.length)),
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, flexShrink: 0, color: 'var(--text2)', minWidth: 24, textAlign: 'right' }}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dernières ventes */}
      <div className="card reveal reveal-5">
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Dernières ventes
          </div>
          <Link href="/caisse" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none', fontWeight: 700, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 4 }}>
            Caisse →
          </Link>
        </div>
        {ventes.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.4 }}>⌀</div>
            <div className="font-display" style={{ fontWeight: 600, marginBottom: 8, fontSize: 16, color: 'var(--text2)' }}>Aucune vente</div>
            <Link href="/caisse" style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
              Aller à la caisse →
            </Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Article</th>
                  <th className="hide-mobile">Déposant</th>
                  <th className="hide-mobile">Paiement</th>
                  <th style={{ textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {ventes.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                        {v.articles?.marque} {v.articles?.modele || v.articles?.type}
                      </div>
                    </td>
                    <td className="hide-mobile" style={{ color: 'var(--text2)', fontSize: 13 }}>
                      {v.deposants?.prenom} {v.deposants?.nom}
                    </td>
                    <td className="hide-mobile">
                      <span className={`badge ${v.methode_paiement === 'cb' ? 'badge-gray' : 'badge-amber'}`}>
                        {v.methode_paiement === 'cb' ? '💳 CB' : '💵 Esp.'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-display" style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>
                        {Number(v.prix_vente).toFixed(2)} €
                      </span>
                    </td>
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
