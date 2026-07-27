import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppContext } from '../App'
import type { Attempt, Exam, SelfEval } from '../types'
import { ProblemMeta, ProblemStatement } from '../components/ProblemView'
import SolutionEditor from '../components/SolutionEditor'
import Katex from '../components/Katex'
import { computeXp } from '../lib/xp'
import { todayKey } from '../lib/streak'
import { formatMinutes, formatSeconds } from './ExamSetup'

type Phase = 'solving' | 'review' | 'summary'

interface AnswerState {
  choice: string | null
  text: string
  evalResult: SelfEval | null
}

export default function ExamPage({ ctx, exam }: { ctx: AppContext; exam: Exam }) {
  const problems = useMemo(
    () => exam.problemIds.map((id) => ctx.problemsById.get(id)).filter((p) => p !== undefined),
    [exam, ctx.problemsById],
  )
  const [phase, setPhase] = useState<Phase>('solving')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<AnswerState[]>(() =>
    problems.map(() => ({ choice: null, text: '', evalResult: null })),
  )
  const [elapsed, setElapsed] = useState(0)
  const [finishedAt, setFinishedAt] = useState(0)
  const recordedRef = useRef(false)

  useEffect(() => {
    if (phase !== 'solving') return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  if (problems.length === 0) {
    return <div className="page"><div className="card">Nenhuma questão desta prova está disponível no banco.</div></div>
  }

  const problem = problems[current]
  const answer = answers[current]

  function setAnswer(patch: Partial<AnswerState>) {
    setAnswers((arr) => arr.map((a, i) => (i === current ? { ...a, ...patch } : a)))
  }

  function finishSolving() {
    setFinishedAt(elapsed)
    // Auto-avalia múltipla escolha contra o gabarito
    setAnswers((arr) =>
      arr.map((a, i) => {
        const p = problems[i]
        if (p.type === 'multiple-choice') {
          return { ...a, evalResult: a.choice === p.answer ? 'correto' : 'errado' }
        }
        return a
      }),
    )
    setCurrent(0)
    setPhase('review')
  }

  function finishReview() {
    if (!recordedRef.current) {
      recordedRef.current = true
      const attempts: Attempt[] = problems.map((p, i) => {
        const a = answers[i]
        const result: SelfEval = a.evalResult ?? 'errado'
        return {
          problemId: p.id,
          date: todayKey(),
          timestamp: Date.now(),
          text: a.text || undefined,
          mcAnswer: a.choice ?? undefined,
          result,
          mode: 'prova',
          xp: computeXp(p.difficulty, result, false),
        }
      })
      const counts = { correto: 0, parcial: 0, errado: 0 }
      for (const a of answers) counts[a.evalResult ?? 'errado']++
      ctx.addExamResult(
        {
          examId: exam.id,
          title: exam.title,
          date: todayKey(),
          elapsedSeconds: finishedAt,
          correct: counts.correto,
          partial: counts.parcial,
          wrong: counts.errado,
          total: problems.length,
        },
        attempts,
      )
    }
    setPhase('summary')
  }

  const allEvaluated = answers.every((a, i) => a.evalResult !== null || problems[i].type === 'multiple-choice')

  if (phase === 'summary') {
    const counts = { correto: 0, parcial: 0, errado: 0 }
    for (const a of answers) counts[a.evalResult ?? 'errado']++
    return (
      <div className="page">
        <h1>Resultado — {exam.title}</h1>
        <div className="card summary-card">
          <div className="summary-score">
            <span className="score-correct">{counts.correto} ✓</span>
            <span className="score-partial">{counts.parcial} ½</span>
            <span className="score-wrong">{counts.errado} ✗</span>
            <span className="muted">de {problems.length} questões</span>
          </div>
          <p>Tempo decorrido: <strong>{formatSeconds(finishedAt)}</strong> · tempo oficial da banca: {formatMinutes(exam.officialTimeMinutes)}</p>
          <div className="action-row">
            <button className="btn btn-primary" onClick={() => ctx.navigate({ name: 'examSetup' })}>Voltar às provas</button>
            <button className="btn" onClick={() => ctx.navigate({ name: 'dashboard' })}>Início</button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'review') {
    return (
      <div className="page">
        <div className="exam-header">
          <h1>Correção — {exam.title}</h1>
          <div className="exam-progress">Questão {current + 1} de {problems.length}</div>
        </div>
        <div className="card">
          <ProblemMeta problem={problem} />
          <ProblemStatement problem={problem} selectedChoice={answer.choice} showAnswer />
        </div>
        {answer.text && (
          <div className="card">
            <h3>Sua solução</h3>
            <Katex text={answer.text} />
          </div>
        )}
        <div className="card solution-card">
          <h2>Solução</h2>
          {problem.answer && <p><strong>Resposta:</strong> <Katex text={problem.answer} className="inline-math" /></p>}
          <Katex text={problem.solution} />
        </div>
        {problem.type === 'multiple-choice' ? (
          <div className={`card result-card result-${answer.evalResult}`}>
            {answer.evalResult === 'correto' ? '🎉 Correta' : answer.choice ? `✗ Incorreta (você marcou ${answer.choice})` : '✗ Em branco'} — corrigida automaticamente pelo gabarito.
          </div>
        ) : (
          <div className="card eval-card">
            <h3>Autoavaliação</h3>
            <div className="action-row">
              <button className={`btn btn-success ${answer.evalResult === 'correto' ? 'pressed' : ''}`} onClick={() => setAnswer({ evalResult: 'correto' })}>✓ Acertei</button>
              <button className={`btn btn-warning ${answer.evalResult === 'parcial' ? 'pressed' : ''}`} onClick={() => setAnswer({ evalResult: 'parcial' })}>½ Parcial</button>
              <button className={`btn btn-danger ${answer.evalResult === 'errado' ? 'pressed' : ''}`} onClick={() => setAnswer({ evalResult: 'errado' })}>✗ Errei</button>
            </div>
          </div>
        )}
        <div className="action-row">
          <button className="btn" disabled={current === 0} onClick={() => setCurrent(current - 1)}>← Anterior</button>
          {current < problems.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setCurrent(current + 1)}>Próxima →</button>
          ) : (
            <button className="btn btn-primary" disabled={!allEvaluated} onClick={finishReview}>
              {allEvaluated ? 'Ver resultado final' : 'Avalie todas as dissertativas'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="exam-header">
        <h1>{exam.title}</h1>
        <div className="exam-timers">
          <span className="badge">⏱ decorrido: {formatSeconds(elapsed)}</span>
          <span className="badge">tempo oficial: {formatMinutes(exam.officialTimeMinutes)} (sem limite aqui)</span>
        </div>
      </div>

      <div className="exam-nav">
        {problems.map((p, i) => {
          const a = answers[i]
          const answered = p.type === 'multiple-choice' ? a.choice !== null : a.text.trim() !== ''
          return (
            <button key={p.id} className={`exam-dot ${i === current ? 'current' : ''} ${answered ? 'answered' : ''}`} onClick={() => setCurrent(i)}>
              {i + 1}
            </button>
          )
        })}
      </div>

      <div className="card">
        <ProblemMeta problem={problem} />
        <ProblemStatement
          problem={problem}
          selectedChoice={answer.choice}
          onSelectChoice={problem.type === 'multiple-choice' ? (l) => setAnswer({ choice: l }) : undefined}
        />
      </div>

      {problem.type === 'open' && (
        <div className="card">
          <SolutionEditor value={answer.text} onChange={(text) => setAnswer({ text })} />
        </div>
      )}

      <div className="action-row">
        <button className="btn" disabled={current === 0} onClick={() => setCurrent(current - 1)}>← Anterior</button>
        <button className="btn" disabled={current === problems.length - 1} onClick={() => setCurrent(current + 1)}>Próxima →</button>
        <button className="btn btn-primary" onClick={finishSolving}>Entregar prova</button>
      </div>
    </div>
  )
}
