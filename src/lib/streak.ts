export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function yesterdayKey(d: Date = new Date()): string {
  const y = new Date(d)
  y.setDate(y.getDate() - 1)
  return todayKey(y)
}

export interface Streak {
  current: number
  best: number
  lastDay: string | null
}

/** Registra atividade do problema do dia; retorna o streak atualizado. */
export function registerDailyActivity(streak: Streak, day: string = todayKey()): Streak {
  if (streak.lastDay === day) return streak
  const current = streak.lastDay === yesterdayKey(new Date(day + 'T12:00:00')) ? streak.current + 1 : 1
  return { current, best: Math.max(streak.best, current), lastDay: day }
}

/** Streak efetivo para exibição: zera se o último dia ativo for antes de ontem. */
export function effectiveStreak(streak: Streak): number {
  if (!streak.lastDay) return 0
  if (streak.lastDay === todayKey() || streak.lastDay === yesterdayKey()) return streak.current
  return 0
}
