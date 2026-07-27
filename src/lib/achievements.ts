import type { Problem, Progress, Topic } from '../types'
import { TOPIC_LABELS } from '../types'

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: string
  earned: (p: Progress, problemsById: Map<string, Problem>) => boolean
}

function solvedCount(p: Progress): number {
  return new Set(p.attempts.map((a) => a.problemId)).size
}

function correctByTopic(p: Progress, problems: Map<string, Problem>, topic: Topic): number {
  const ids = new Set(
    p.attempts
      .filter((a) => a.result === 'correto' && problems.get(a.problemId)?.topic === topic)
      .map((a) => a.problemId),
  )
  return ids.size
}

function topicAchievement(topic: Topic, icon: string): AchievementDef {
  return {
    id: `topic-${topic}-10`,
    title: `Mestre em ${TOPIC_LABELS[topic]}`,
    description: `Acerte 10 problemas de ${TOPIC_LABELS[topic].toLowerCase()}`,
    icon,
    earned: (p, m) => correctByTopic(p, m, topic) >= 10,
  }
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-attempt', title: 'Primeiro Passo', description: 'Registre sua primeira tentativa', icon: '👣', earned: (p) => p.attempts.length >= 1 },
  { id: 'first-correct', title: 'Primeiro Acerto', description: 'Acerte seu primeiro problema', icon: '✅', earned: (p) => p.attempts.some((a) => a.result === 'correto') },
  { id: 'streak-3', title: 'Aquecendo', description: '3 dias seguidos no problema do dia', icon: '🔥', earned: (p) => p.streak.best >= 3 },
  { id: 'streak-7', title: 'Uma Semana', description: '7 dias seguidos no problema do dia', icon: '📅', earned: (p) => p.streak.best >= 7 },
  { id: 'streak-30', title: 'Um Mês Inteiro', description: '30 dias seguidos no problema do dia', icon: '🗓️', earned: (p) => p.streak.best >= 30 },
  { id: 'streak-100', title: 'Centurião', description: '100 dias seguidos no problema do dia', icon: '💯', earned: (p) => p.streak.best >= 100 },
  { id: 'first-imo', title: 'Palco Mundial', description: 'Tente um problema da IMO', icon: '🌍', earned: (p, m) => p.attempts.some((a) => m.get(a.problemId)?.olympiad === 'IMO') },
  { id: 'imo-correct', title: 'Nível Olímpico', description: 'Acerte um problema da IMO', icon: '🏅', earned: (p, m) => p.attempts.some((a) => a.result === 'correto' && m.get(a.problemId)?.olympiad === 'IMO') },
  topicAchievement('algebra', '➗'),
  topicAchievement('geometria', '📐'),
  topicAchievement('combinatoria', '🎲'),
  topicAchievement('teoria-numeros', '🔢'),
  { id: 'first-exam', title: 'Dia de Prova', description: 'Complete uma prova inteira', icon: '📝', earned: (p) => p.examResults.length >= 1 },
  { id: 'solved-50', title: 'Cinquentão', description: 'Tente 50 problemas diferentes', icon: '🏃', earned: (p) => solvedCount(p) >= 50 },
  { id: 'solved-200', title: 'Maratonista', description: 'Tente 200 problemas diferentes', icon: '🏆', earned: (p) => solvedCount(p) >= 200 },
  {
    id: 'combo-5',
    title: 'Em Chamas',
    description: 'Acerte 5 problemas consecutivos',
    icon: '⚡',
    earned: (p) => {
      let run = 0
      for (const a of p.attempts) {
        run = a.result === 'correto' ? run + 1 : 0
        if (run >= 5) return true
      }
      return false
    },
  },
  { id: 'first-ai', title: 'Segunda Opinião', description: 'Peça sua primeira correção por IA', icon: '🤖', earned: (p) => p.attempts.some((a) => a.aiFeedback) },
]

/** Retorna ids de conquistas recém-desbloqueadas e a lista completa atualizada. */
export function checkAchievements(p: Progress, problemsById: Map<string, Problem>): { unlocked: AchievementDef[]; all: string[] } {
  const unlocked: AchievementDef[] = []
  const all = [...p.achievements]
  for (const def of ACHIEVEMENTS) {
    if (!all.includes(def.id) && def.earned(p, problemsById)) {
      all.push(def.id)
      unlocked.push(def)
    }
  }
  return { unlocked, all }
}
