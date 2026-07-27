import type { Difficulty, SelfEval } from '../types'

const BASE_XP: Record<Difficulty, number> = { 1: 10, 2: 20, 3: 35, 4: 55, 5: 80 }

const RESULT_MULT: Record<SelfEval, number> = {
  correto: 1,
  parcial: 0.6,
  errado: 0.25,
}

export function computeXp(difficulty: Difficulty, result: SelfEval, isDaily: boolean): number {
  let xp = BASE_XP[difficulty] * RESULT_MULT[result]
  if (isDaily) xp *= 1.5
  return Math.round(xp)
}

export interface ProfileLevel {
  name: string
  minXp: number
}

export const LEVELS: ProfileLevel[] = [
  { name: 'Iniciante', minXp: 0 },
  { name: 'Escolar', minXp: 100 },
  { name: 'Regional', minXp: 300 },
  { name: 'Estadual', minXp: 700 },
  { name: 'Nacional', minXp: 1500 },
  { name: 'Internacional', minXp: 3000 },
  { name: 'Medalhista', minXp: 6000 },
]

export function levelForXp(xp: number): { level: ProfileLevel; next: ProfileLevel | null; progress: number } {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) idx = i
  }
  const level = LEVELS[idx]
  const next = idx + 1 < LEVELS.length ? LEVELS[idx + 1] : null
  const progress = next ? (xp - level.minXp) / (next.minXp - level.minXp) : 1
  return { level, next, progress }
}
