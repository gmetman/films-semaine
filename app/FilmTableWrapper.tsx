'use client'
import { useProfile } from './ProfileContext'
import { type ReactNode } from 'react'

export default function FilmTableWrapper({ children }: { children: ReactNode }) {
  const { filterNegative } = useProfile()
  return (
    <div className={`w${filterNegative ? ' filter-neg' : ''}`}>
      {children}
    </div>
  )
}
