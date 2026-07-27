import type { Problem, Settings } from '../types'
import { filterBySources } from './bank'

/** Hash determinístico simples (FNV-1a) da string da data. */
function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Escolhe o problema do dia de forma determinística a partir da data local.
 * O banco é ordenado por id, então o resultado é estável entre sessões.
 */
export function dailyProblem(problems: Problem[], settings: Settings, dayKey: string): Problem | null {
  const eligible = filterBySources(problems, settings).filter(
    (p) => p.difficulty >= settings.dailyMinDifficulty && p.difficulty <= settings.dailyMaxDifficulty,
  )
  if (eligible.length === 0) return null
  const idx = hashString('olimmath-' + dayKey) % eligible.length
  return eligible[idx]
}
