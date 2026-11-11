export interface Cinema {
  name: string
  type: 'pathe' | 'ugc' | 'mk2' | 'other'
  note?: string
  allocine_url?: string
  showtimes?: Record<string, string[]>  // e.g. { "En VF": ["15h45", "17h50"] }
}

export interface Film {
  id?: string
  week_date: string            // ISO date string of the Wednesday
  title: string
  original_title?: string | null
  allocine_id: string
  allocine_url: string
  trailer_url?: string | null
  poster_url?: string | null
  year?: number | null
  duration?: string | null
  genres: string[]
  age_rating?: string | null
  age_banned: boolean
  countries: string[]
  director?: string | null
  actors: string[]
  press_score?: number | null
  audience_score?: number | null
  combined_score: number
  score_tier: 'incontournable' | 'tres_bon' | 'bon' | 'correct'
  prizes?: string | null
  cinemas: Cinema[]
}
