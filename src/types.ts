export type Source = 'real' | 'autoral'
export type Olympiad = 'OBMEP' | 'OBM' | 'IMO' | 'ConeSul' | 'Ibero' | 'Autoral'
export type Topic = 'algebra' | 'geometria' | 'combinatoria' | 'teoria-numeros'
export type Difficulty = 1 | 2 | 3 | 4 | 5
export type SelfEval = 'correto' | 'parcial' | 'errado'

export interface Problem {
  id: string
  source: Source
  olympiad: Olympiad
  year?: number
  originalLevel?: string
  originalNumber?: number
  difficulty: Difficulty
  topic: Topic
  language: 'pt' | 'en'
  type: 'multiple-choice' | 'open'
  statement: string
  choices?: string[]
  answer?: string
  solution: string
  solutionSource?: 'official' | 'ai'
  figureSvg?: string
  figureNote?: string
}

export interface Exam {
  id: string
  title: string
  olympiad: Olympiad
  year?: number
  level: string
  officialTimeMinutes: number
  problemIds: string[]
  description?: string
}

export interface Manifest {
  problemShards: { file: string; count: number }[]
  examShards: { file: string }[]
}

export interface Attempt {
  problemId: string
  date: string // YYYY-MM-DD local
  timestamp: number
  text?: string
  mcAnswer?: string
  result: SelfEval
  mode: 'livre' | 'diario' | 'prova'
  xp: number
  aiFeedback?: string
}

export interface ExamResult {
  examId: string
  title: string
  date: string
  elapsedSeconds: number
  correct: number
  partial: number
  wrong: number
  total: number
}

export interface Settings {
  sourcesEnabled: { real: boolean; autoral: boolean }
  dailyMinDifficulty: Difficulty
  dailyMaxDifficulty: Difficulty
  apiKey: string
  model: string
}

export interface Progress {
  attempts: Attempt[]
  examResults: ExamResult[]
  streak: { current: number; best: number; lastDay: string | null }
  xp: number
  achievements: string[]
  settings: Settings
}

export const DEFAULT_SETTINGS: Settings = {
  sourcesEnabled: { real: true, autoral: true },
  dailyMinDifficulty: 1,
  dailyMaxDifficulty: 3,
  apiKey: '',
  model: 'claude-opus-5',
}

export const TOPIC_LABELS: Record<Topic, string> = {
  algebra: 'Álgebra',
  geometria: 'Geometria',
  combinatoria: 'Combinatória',
  'teoria-numeros': 'Teoria dos Números',
}
