'use client'
import { ProfileProvider } from './ProfileContext'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return <ProfileProvider>{children}</ProfileProvider>
}
