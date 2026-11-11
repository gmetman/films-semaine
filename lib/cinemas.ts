export interface CinemaConfig {
  id: string
  name: string
  type: 'pathe' | 'ugc' | 'mk2' | 'other'
  note?: string
}

export const CINEMAS: CinemaConfig[] = [
  { id: 'C0161', name: 'Convention', type: 'pathe' },
  { id: 'C0159', name: 'Ciné Cité Les Halles', type: 'ugc' },
  { id: 'C0025', name: '7 Parnassiens', type: 'other' },
  { id: 'C0092', name: 'MK2 Odéon St Michel', type: 'mk2' },
  { id: 'C0097', name: 'MK2 Odéon St Germain', type: 'mk2' },
  { id: 'C0104', name: 'UGC Odéon', type: 'ugc', note: '*' },
  { id: 'C0105', name: 'UGC Rotonde', type: 'ugc', note: '*' },
  { id: 'W7502', name: 'Beaugrenelle', type: 'pathe' },
  { id: 'C0052', name: 'Pathé Montparnos', type: 'pathe', note: '*' },
  { id: 'C0103', name: 'UGC Montparnasse', type: 'ugc' },
  { id: 'C0102', name: 'UGC Danton', type: 'ugc', note: '*' },
  { id: 'P8088', name: "L'Aiglon", type: 'other' },        // L'Aigle (Orne)
  { id: 'W1410', name: 'Étoile (Mortagne)', type: 'other' }, // Mortagne-au-Perche
]

export const EXCLUDED_GENRES = ['Epouvante-horreur', 'Horreur', 'Épouvante-horreur']
