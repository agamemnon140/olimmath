import type { Attempt, ExamResult, Progress, Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { registerDailyActivity } from './streak'

const KEY = 'olimmath-progress'

function emptyProgress(): Progress {
  return {
    attempts: [],
    examResults: [],
    streak: { current: 0, best: 0, lastDay: null },
    xp: 0,
    achievements: [],
    settings: { ...DEFAULT_SETTINGS, sourcesEnabled: { ...DEFAULT_SETTINGS.sourcesEnabled } },
  }
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Partial<Progress>
    const base = emptyProgress()
    return {
      ...base,
      ...parsed,
      streak: { ...base.streak, ...parsed.streak },
      settings: {
        ...base.settings,
        ...parsed.settings,
        sourcesEnabled: { ...base.settings.sourcesEnabled, ...parsed.settings?.sourcesEnabled },
      },
    }
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(p: Progress): void {
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function recordAttempt(p: Progress, attempt: Attempt): Progress {
  const next: Progress = { ...p, attempts: [...p.attempts, attempt], xp: p.xp + attempt.xp }
  if (attempt.mode === 'diario') {
    next.streak = registerDailyActivity(p.streak, attempt.date)
  }
  return next
}

export function recordExamResult(p: Progress, result: ExamResult): Progress {
  return { ...p, examResults: [...p.examResults, result] }
}

export function updateSettings(p: Progress, settings: Settings): Progress {
  return { ...p, settings }
}

export function exportProgress(p: Progress): string {
  return JSON.stringify(p, null, 2)
}

export function importProgress(json: string): Progress {
  const parsed = JSON.parse(json) as Progress
  if (!Array.isArray(parsed.attempts) || typeof parsed.xp !== 'number') {
    throw new Error('Arquivo de progresso inválido')
  }
  return parsed
}

export function attemptsFor(p: Progress, problemId: string): Attempt[] {
  return p.attempts.filter((a) => a.problemId === problemId)
}

export function bestResultFor(p: Progress, problemId: string): Attempt | undefined {
  const order = { correto: 3, parcial: 2, errado: 1 }
  return attemptsFor(p, problemId).sort((a, b) => order[b.result] - order[a.result])[0]
}
