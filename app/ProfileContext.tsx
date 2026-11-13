'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'

export const PROFILES = ['Guillaume', 'Pascale', 'Arthur', 'Louise', 'Manon'] as const
export type Profile = typeof PROFILES[number]
export type Choice = 'prefere' | 'pourquoi_pas' | 'vu' | 'no'
export type Prefs = Record<string, Choice>
export type VoteCounts = Record<string, Partial<Record<Choice, number>>>
export type ProfileVotes = Record<string, Partial<Record<Profile, Choice>>>

export const PROFILE_EMAILS: Record<string, Profile> = {
  'guillaume.metman@ensta.org': 'Guillaume',
  'pascale.metman@gmail.com': 'Pascale',
  'arthur.metman@gmail.com': 'Arthur',
  'louise.metman@gmail.com': 'Louise',
  'manon.metman@gmail.com': 'Manon',
}

interface ProfileCtxValue {
  selected: Profile
  setSelected: (p: Profile) => void
  prefs: Prefs
  voteCounts: VoteCounts
  profileVotes: ProfileVotes
  activeProfiles: Set<Profile>
  toggleProfile: (p: Profile) => void
  filterNegative: boolean
  setFilterNegative: (v: boolean) => void
  setChoice: (allocineId: string, weekDate: string, choice: Choice | null) => Promise<void>
  clearAll: (weekDate: string) => Promise<void>
}

const ProfileCtx = createContext<ProfileCtxValue | null>(null)

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

function getWeekDate(): string {
  const now = new Date()
  const diff = (now.getDay() + 7 - 3) % 7
  const wed = new Date(now)
  wed.setDate(now.getDate() - diff)
  return wed.toISOString().slice(0, 10)
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [selected, setSelectedState] = useState<Profile>('Guillaume')
  const [prefs, setPrefs] = useState<Prefs>({})
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({})
  const [profileVotes, setProfileVotes] = useState<ProfileVotes>({})
  const [activeProfiles, setActiveProfiles] = useState<Set<Profile>>(new Set(PROFILES))
  const [filterNegative, setFilterNegative] = useState(false)
  const prefsRef = useRef<Prefs>({})
  prefsRef.current = prefs

  // Restore saved profile on mount; ?email= param takes precedence
  useEffect(() => {
    try {
      // Check URL param first
      const params = new URLSearchParams(window.location.search)
      const emailParam = params.get('email')
      if (emailParam && PROFILE_EMAILS[emailParam]) {
        setSelectedState(PROFILE_EMAILS[emailParam])
        return
      }
      // Fall back to localStorage
      const saved = localStorage.getItem('films_profile') as Profile | null
      if (saved && (PROFILES as readonly string[]).includes(saved)) {
        setSelectedState(saved as Profile)
      }
    } catch {}
  }, [])

  // Load this profile's prefs when profile changes
  useEffect(() => {
    const weekDate = getWeekDate()
    sb.from('user_preferences')
      .select('allocine_id, choice')
      .eq('profile', selected)
      .eq('week_date', weekDate)
      .then(({ data }) => {
        const map: Prefs = {}
        for (const row of data ?? []) map[row.allocine_id] = row.choice as Choice
        setPrefs(map)
      })
  }, [selected])

  // Load global vote counts for the week (once, then updated optimistically)
  useEffect(() => {
    const weekDate = getWeekDate()
    sb.from('user_preferences')
      .select('allocine_id, choice, profile')
      .eq('week_date', weekDate)
      .then(({ data }) => {
        const counts: VoteCounts = {}
        const pv: ProfileVotes = {}
        for (const row of data ?? []) {
          if (!counts[row.allocine_id]) counts[row.allocine_id] = {}
          const c = row.choice as Choice
          counts[row.allocine_id][c] = (counts[row.allocine_id][c] ?? 0) + 1
          if (!pv[row.allocine_id]) pv[row.allocine_id] = {}
          pv[row.allocine_id][row.profile as Profile] = c
        }
        setVoteCounts(counts)
        setProfileVotes(pv)
      })
  }, [])

  const setSelected = useCallback((p: Profile) => {
    setSelectedState(p)
    try { localStorage.setItem('films_profile', p) } catch {}
  }, [])

  const toggleProfile = useCallback((p: Profile) => {
    setActiveProfiles(prev => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }, [])

  const setChoice = useCallback(async (allocineId: string, weekDate: string, choice: Choice | null) => {
    const prevChoice = prefsRef.current[allocineId]

    // Write to Supabase
    if (choice === null) {
      await sb.from('user_preferences').delete()
        .eq('profile', selected).eq('allocine_id', allocineId).eq('week_date', weekDate)
    } else {
      await sb.from('user_preferences').upsert(
        { profile: selected, allocine_id: allocineId, week_date: weekDate, choice },
        { onConflict: 'profile,allocine_id,week_date' },
      )
    }

    // Update local prefs
    setPrefs(prev => {
      const n = { ...prev }
      if (choice === null) delete n[allocineId]
      else n[allocineId] = choice
      return n
    })

    // Update vote counts optimistically
    setVoteCounts(prev => {
      const film = { ...(prev[allocineId] ?? {}) }
      if (prevChoice) film[prevChoice] = Math.max(0, (film[prevChoice] ?? 0) - 1)
      if (choice) film[choice] = (film[choice] ?? 0) + 1
      return { ...prev, [allocineId]: film }
    })

    // Update profileVotes optimistically
    setProfileVotes(prev => {
      const film = { ...(prev[allocineId] ?? {}) }
      if (choice === null) delete film[selected]
      else film[selected] = choice
      return { ...prev, [allocineId]: film }
    })
  }, [selected])

  const clearAll = useCallback(async (weekDate: string) => {
    await sb.from('user_preferences').delete()
      .eq('profile', selected).eq('week_date', weekDate)

    // Remove this profile's votes from counts
    const currentPrefs = prefsRef.current
    setVoteCounts(prev => {
      const next = { ...prev }
      for (const [id, choice] of Object.entries(currentPrefs)) {
        if (next[id]) {
          next[id] = { ...next[id] }
          next[id][choice] = Math.max(0, (next[id][choice] ?? 0) - 1)
        }
      }
      return next
    })
    setProfileVotes(prev => {
      const next = { ...prev }
      for (const id of Object.keys(currentPrefs)) {
        if (next[id]) {
          next[id] = { ...next[id] }
          delete next[id][selected]
        }
      }
      return next
    })
    setPrefs({})
  }, [selected])

  return (
    <ProfileCtx.Provider value={{ selected, setSelected, prefs, voteCounts, profileVotes, activeProfiles, toggleProfile, filterNegative, setFilterNegative, setChoice, clearAll }}>
      {children}
    </ProfileCtx.Provider>
  )
}

export function useProfile() {
  const c = useContext(ProfileCtx)
  if (!c) throw new Error('useProfile outside ProfileProvider')
  return c
}
