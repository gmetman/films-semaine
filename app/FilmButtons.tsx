'use client'
import { useProfile } from './ProfileContext'

interface Props {
  allocineId: string
  weekDate: string
}

export default function FilmButtons({ allocineId, weekDate }: Props) {
  const { prefs, setChoice } = useProfile()
  const choice = prefs[allocineId]

  return (
    <>
      <button
        className={choice === 'vu' ? 'btn-on' : ''}
        onClick={() => setChoice(allocineId, weekDate, choice === 'vu' ? null : 'vu')}
      >
        {choice === 'vu' ? '✓ Déjà vu' : 'Déjà vu'}
      </button>
      <button
        className={choice === 'no' ? 'btn-on' : ''}
        onClick={() => setChoice(allocineId, weekDate, choice === 'no' ? null : 'no')}
      >
        {choice === 'no' ? '✗ Pas intéressé' : 'Pas intéressé'}
      </button>
    </>
  )
}
