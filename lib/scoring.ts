export type ScoreTier = 'incontournable' | 'tres_bon' | 'bon' | 'correct'

export function calculateCombinedScore(
  press: number | null | undefined,
  audience: number | null | undefined,
  prizeBonus = 0,
): number {
  if (!press && !audience) return 0
  const p = press ?? audience!
  const s = audience ?? press!
  const base = p * 0.6 + s * 0.4
  return Math.round((base + Math.min(prizeBonus, 0.40)) * 100) / 100
}

export function getScoreTier(score: number): ScoreTier {
  if (score >= 4.5) return 'incontournable'
  if (score >= 4.2) return 'tres_bon'
  if (score >= 3.9) return 'bon'
  return 'correct'
}

export const TIER_LABELS: Record<ScoreTier, string> = {
  incontournable: 'Incontournable',
  tres_bon: 'Très bon',
  bon: 'Bon',
  correct: 'Correct',
}

export const TIER_CSS: Record<ScoreTier, string> = {
  incontournable: 't1',
  tres_bon: 't2',
  bon: 't3',
  correct: 't4',
}

export const TIER_BAR_WIDTH: Record<ScoreTier, string> = {
  incontournable: '95%',
  tres_bon: '87%',
  bon: '80%',
  correct: '72%',
}

export function scoreBarWidth(score: number): string {
  return `${Math.round((score / 5) * 100)}%`
}
