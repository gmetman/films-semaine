'use client'
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'

export const PROFILES = ['Guillaume', 'Pascale', 'Arthur', 'Louise', 'Manon'] as const
export type Profile = typeof PROFILES[number]
export type Choice = 'vu' | 'no'
export type Prefs = Record<string, Choice>

interface ProfileCtxValue {
  selected: Profile
  setSelected: (p: Profile) => void
  prefs: Prefs
  setChoice: (allocineId: string, weekDate: string, choice: Choice | null) => Promise<void>
  clearAll: (weekDate: string) => Promise<void>
}

const ProfileCtx = createContext<ProfileCtxValue | null>(null)

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [selected, setSelectedState] = useState<Profile>('Guillaume')
  const [prefs, setPrefs] = useState<Prefs>({})

  // Restore saved profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('films_profile') as Profile | null
      if (saved && (PROFILES as readonly string[]).includes(saved)) {
        setSelectedState(saved as Profile)
      }
    } catch {}
  }, [])

  // Load preferences from Supabase when profile changes
  useEffect(() => {
    const now = new Date()
    const diff = (now.getDay() + 7 - 3) % 7
    const wed = new Date(now)
    wed.setDate(now.getDate() - diff)
    const weekDate = wed.toISOString().slice(0, 10)

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

  const setSelected = useCallback((p: Profile) => {
    setSelectedState(p)
    try { localStorage.setItem('films_profile', p) } catch {}
  }, [])

  const setChoice = useCallback(async (allocineId: string, weekDate: string, choice: Choice | null) => {
    if (choice === null) {
      await sb.from('user_preferences').delete()
        .eq('profile', selected).eq('allocine_id', allocineId).eq('week_date', weekDate)
      setPrefs(prev => { const n = { ...prev }; delete n[allocineId]; return n })
    } else {
      await sb.from('user_preferences').upsert(
        { profile: selected, allocine_id: allocineId, week_date: weekDate, choice },
        { onConflict: 'profile,allocine_id,week_date' },
      )
      setPrefs(prev => ({ ...prev, [allocineId]: choice }))
    }
  }, [selected])

  const clearAll = useCallback(async (weekDate: string) => {
    await sb.from('user_preferences').delete()
      .eq('profile', selected).eq('week_date', weekDate)
    setPrefs({})
  }, [selected])

  return (
    <ProfileCtx.Provider value={{ selected, setSelected, prefs, setChoice, clearAll }}>
      {children}
    </ProfileCtx.Provider>
  )
}

export function useProfile() {
  const c = useContext(ProfileCtx)
  if (!c) throw new Error('useProfile outside ProfileProvider')
  return c
}
