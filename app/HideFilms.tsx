'use client'
import { useEffect } from 'react'
import { useProfile } from './ProfileContext'

export default function HideFilms({ weekDate }: { weekDate: string }) {
  const { prefs, clearAll } = useProfile()

  useEffect(() => {
    const rows = document.querySelectorAll<HTMLTableRowElement>('tbody tr[data-id]')
    let hidden = 0
    rows.forEach(row => {
      const c = prefs[row.dataset.id!]
      const isHidden = c === 'vu' || c === 'no'
      row.classList.toggle('h', isHidden)
      if (isHidden) hidden++
    })
    const cnt = document.getElementById('cnt')
    const rst = document.getElementById('rst')
    if (cnt) cnt.textContent = hidden > 0 ? `${hidden} film(s) masqué(s)` : ''
    if (rst) rst.style.display = hidden > 0 ? 'inline' : 'none'
  }, [prefs])

  return (
    <>
      <span id="cnt" />
      {' '}
      <a id="rst" style={{ display: 'none', cursor: 'pointer' }}
        onClick={() => clearAll(weekDate)}>
        Tout réafficher
      </a>
    </>
  )
}
