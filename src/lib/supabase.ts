import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types
export type Deposant = {
  id: string
  nom: string
  prenom: string
  telephone: string | null
  email: string | null
  iban: string | null
  notes: string | null
  created_at: string
}

export type Article = {
  id: string
  deposant_id: string
  type: string
  marque: string
  modele: string | null
  taille: string | null
  etat: string
  prix_vente: number
  commission_boutique: number
  commission_deposant: number
  montant_boutique: number
  montant_deposant: number
  statut: 'en_rayon' | 'vendu' | 'recupere'
  qr_code_id: string
  description: string | null
  created_at: string
  deposants?: Deposant
}

export type Vente = {
  id: string
  article_id: string
  deposant_id: string
  prix_vente: number
  montant_boutique: number
  montant_deposant: number
  methode_paiement: 'cb' | 'especes'
  created_at: string
}

export type Reversement = {
  id: string
  deposant_id: string
  montant: number
  statut: 'pending' | 'paid'
  notes: string | null
  paid_at: string | null
  created_at: string
  deposants?: Deposant
}
