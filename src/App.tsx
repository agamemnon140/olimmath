import { useEffect, useMemo, useState } from 'react'
import type { Attempt, Exam, ExamResult, Problem, Progress, Settings } from './types'
import { loadAllExams, loadAllProblems } from './lib/bank'
import { checkAchievements, type AchievementDef } from './lib/achievements'
import { loadProgress, recordAttempt, recordExamResult, saveProgress, updateSettings } from './lib/progress'
import Dashboard from './pages/Dashboard'
import Library from './pages/Library'
import ProblemPage from './pages/ProblemPage'
import ExamSetup from './pages/ExamSetup'
import ExamPage from './pages/ExamPage'
import Achievements from './pages/Achievements'
import SettingsPage from './pages/SettingsPage'

export type View =
  | { name: 'dashboard' }
  | { name: 'library' }
  | { name: 'problem'; id: string; mode: 'livre' | 'diario' }
  | { name: 'examSetup' }
  | { name: 'exam'; exam: Exam }
  | { name: 'achievements' }
  | { name: 'settings' }

export interface AppContext {
  problems: Problem[]
  problemsById: Map<string, Problem>
  exams: Exam[]
  progress: Progress
  addAttempt: (a: Attempt) => void
  addExamResult: (r: ExamResult, attempts: Attempt[]) => void
  setSettings: (s: Settings) => void
  replaceProgress: (p: Progress) => void
  navigate: (v: View) => void
}

export default function App() {
  const [view, setView] = useState<View>({ name: 'dashboard' })
  const [problems, setProblems] = useState<Problem[] | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<AchievementDef[]>([])

  useEffect(() => {
    Promise.all([loadAllProblems(), loadAllExams()])
      .then(([p, e]) => {
        setProblems(p)
        setExams(e)
      })
      .catch((err) => setLoadError(String(err)))
  }, [])

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const problemsById = useMemo(() => new Map((problems ?? []).map((p) => [p.id, p])), [problems])

  function pushAchievementToasts(next: Progress): Progress {
    const { unlocked, all } = checkAchievements(next, problemsById)
    if (unlocked.length > 0) {
      setToasts((t) => [...t, ...unlocked])
      setTimeout(() => setToasts((t) => t.slice(unlocked.length)), 5000)
    }
    return { ...next, achievements: all }
  }

  const ctx: AppContext = {
    problems: problems ?? [],
    problemsById,
    exams,
    progress,
    addAttempt: (a) => setProgress((p) => pushAchievementToasts(recordAttempt(p, a))),
    addExamResult: (r, attempts) =>
      setProgress((p) => {
        let next = p
        for (const a of attempts) next = recordAttempt(next, a)
        next = recordExamResult(next, r)
        return pushAchievementToasts(next)
      }),
    setSettings: (s) => setProgress((p) => updateSettings(p, s)),
    replaceProgress: (p) => setProgress(p),
    navigate: setView,
  }

  if (loadError) {
    return (
      <div className="app-shell">
        <div className="card error-card">
          <h2>Erro ao carregar o banco de problemas</h2>
          <p>{loadError}</p>
          <p className="muted">Rode o app via <code>npm run dev</code> (o banco é carregado por fetch).</p>
        </div>
      </div>
    )
  }

  if (!problems) {
    return (
      <div className="app-shell centered">
        <div className="loading">Carregando banco de problemas…</div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView({ name: 'dashboard' })}>
          Σ OlimMath
        </button>
        <nav>
          <button className={view.name === 'dashboard' ? 'active' : ''} onClick={() => setView({ name: 'dashboard' })}>Início</button>
          <button className={view.name === 'library' ? 'active' : ''} onClick={() => setView({ name: 'library' })}>Problemas</button>
          <button className={view.name === 'examSetup' || view.name === 'exam' ? 'active' : ''} onClick={() => setView({ name: 'examSetup' })}>Provas</button>
          <button className={view.name === 'achievements' ? 'active' : ''} onClick={() => setView({ name: 'achievements' })}>Medalhas</button>
          <button className={view.name === 'settings' ? 'active' : ''} onClick={() => setView({ name: 'settings' })}>⚙</button>
        </nav>
      </header>

      <main>
        {view.name === 'dashboard' && <Dashboard ctx={ctx} />}
        {view.name === 'library' && <Library ctx={ctx} />}
        {view.name === 'problem' && <ProblemPage ctx={ctx} problemId={view.id} mode={view.mode} />}
        {view.name === 'examSetup' && <ExamSetup ctx={ctx} />}
        {view.name === 'exam' && <ExamPage ctx={ctx} exam={view.exam} />}
        {view.name === 'achievements' && <Achievements ctx={ctx} />}
        {view.name === 'settings' && <SettingsPage ctx={ctx} />}
      </main>

      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span className="toast-icon">{t.icon}</span>
            <div>
              <strong>Medalha desbloqueada!</strong>
              <div>{t.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
