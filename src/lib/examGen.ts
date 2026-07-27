import type { Difficulty, Exam, Olympiad, Problem, Settings } from '../types'
import { filterBySources } from './bank'

export interface ExamTemplate {
  id: string
  title: string
  olympiad: Olympiad
  level: string
  officialTimeMinutes: number
  numQuestions: number
  type: 'multiple-choice' | 'open' | 'mixed'
  difficultyRange: [Difficulty, Difficulty]
}

export const EXAM_TEMPLATES: ExamTemplate[] = [
  { id: 'obmep-f1-n1', title: 'Estilo OBMEP Nível 1 — 1ª Fase', olympiad: 'OBMEP', level: 'N1', officialTimeMinutes: 150, numQuestions: 20, type: 'multiple-choice', difficultyRange: [1, 2] },
  { id: 'obmep-f1-n2', title: 'Estilo OBMEP Nível 2 — 1ª Fase', olympiad: 'OBMEP', level: 'N2', officialTimeMinutes: 150, numQuestions: 20, type: 'multiple-choice', difficultyRange: [1, 3] },
  { id: 'obmep-f1-n3', title: 'Estilo OBMEP Nível 3 — 1ª Fase', olympiad: 'OBMEP', level: 'N3', officialTimeMinutes: 150, numQuestions: 20, type: 'multiple-choice', difficultyRange: [2, 3] },
  { id: 'obm-f1-n1', title: 'Estilo OBM Nível 1 — 1ª Fase', olympiad: 'OBM', level: 'N1', officialTimeMinutes: 180, numQuestions: 20, type: 'multiple-choice', difficultyRange: [1, 2] },
  { id: 'obm-f1-n2', title: 'Estilo OBM Nível 2 — 1ª Fase', olympiad: 'OBM', level: 'N2', officialTimeMinutes: 180, numQuestions: 20, type: 'multiple-choice', difficultyRange: [1, 3] },
  { id: 'obm-f1-n3', title: 'Estilo OBM Nível 3 — 1ª Fase', olympiad: 'OBM', level: 'N3', officialTimeMinutes: 180, numQuestions: 20, type: 'multiple-choice', difficultyRange: [2, 4] },
  { id: 'obm-f3', title: 'Estilo OBM — 3ª Fase (dissertativa)', olympiad: 'OBM', level: 'N3', officialTimeMinutes: 270, numQuestions: 5, type: 'open', difficultyRange: [3, 5] },
  { id: 'imo-day', title: 'Estilo IMO — um dia de prova', olympiad: 'IMO', level: 'IMO', officialTimeMinutes: 270, numQuestions: 3, type: 'open', difficultyRange: [4, 5] },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Gera uma prova típica sorteando problemas do banco conforme o template.
 * Prioriza a olimpíada do template; completa com problemas de dificuldade
 * compatível de outras olimpíadas se faltar material.
 */
export function generateExam(template: ExamTemplate, problems: Problem[], settings: Settings): Exam | null {
  const [minD, maxD] = template.difficultyRange
  const pool = filterBySources(problems, settings).filter((p) => {
    if (p.difficulty < minD || p.difficulty > maxD) return false
    if (template.type !== 'mixed' && p.type !== template.type) return false
    return true
  })
  const preferred = pool.filter((p) => p.olympiad === template.olympiad)
  const others = pool.filter((p) => p.olympiad !== template.olympiad)
  const picked = [...shuffle(preferred), ...shuffle(others)].slice(0, template.numQuestions)
  if (picked.length === 0) return null
  picked.sort((a, b) => a.difficulty - b.difficulty)
  return {
    id: `gen-${template.id}-${Date.now()}`,
    title: template.title,
    olympiad: template.olympiad,
    level: template.level,
    officialTimeMinutes: template.officialTimeMinutes,
    problemIds: picked.map((p) => p.id),
    description: picked.length < template.numQuestions ? `Prova reduzida: ${picked.length}/${template.numQuestions} questões disponíveis no banco com os filtros atuais.` : undefined,
  }
}
