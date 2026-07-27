import { useState } from 'react'
import type { AppContext } from '../App'
import type { SelfEval } from '../types'
import { ProblemMeta, ProblemStatement } from '../components/ProblemView'
import SolutionEditor from '../components/SolutionEditor'
import Katex from '../components/Katex'
import { computeXp } from '../lib/xp'
import { todayKey } from '../lib/streak'
import { gradeSolution } from '../lib/ai'
import { attemptsFor } from '../lib/progress'

interface Props {
  ctx: AppContext
  problemId: string
  mode: 'livre' | 'diario'
}

export default function ProblemPage({ ctx, problemId, mode }: Props) {
  const problem = ctx.problemsById.get(problemId)
  const [text, setText] = useState('')
  const [choice, setChoice] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [recorded, setRecorded] = useState<{ result: SelfEval; xp: number } | null>(null)
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  if (!problem) {
    return <div className="page"><div className="card">Problema não encontrado.</div></div>
  }

  const isMC = problem.type === 'multiple-choice'
  const alreadyDoneToday = mode === 'diario' && ctx.progress.attempts.some((a) => a.mode === 'diario' && a.date === todayKey())
  const pastAttempts = attemptsFor(ctx.progress, problem.id)

  function record(result: SelfEval) {
    if (!problem || recorded) return
    const isDaily = mode === 'diario' && !alreadyDoneToday
    const xp = computeXp(problem.difficulty, result, isDaily)
    ctx.addAttempt({
      problemId: problem.id,
      date: todayKey(),
      timestamp: Date.now(),
      text: text || undefined,
      mcAnswer: choice ?? undefined,
      result,
      mode: isDaily ? 'diario' : 'livre',
      xp,
    })
    setRecorded({ result, xp })
  }

  function revealMC() {
    if (!problem || !choice) return
    setRevealed(true)
    record(choice === problem.answer ? 'correto' : 'errado')
  }

  async function askAi() {
    if (!problem) return
    const { apiKey, model } = ctx.progress.settings
    setAiLoading(true)
    setAiError(null)
    try {
      const attemptText = text || (choice ? `Resposta escolhida: alternativa ${choice}.` : '')
      const feedback = await gradeSolution(problem, attemptText, apiKey, model)
      setAiFeedback(feedback)
      ctx.addAttempt({
        problemId: problem.id,
        date: todayKey(),
        timestamp: Date.now(),
        text: text || undefined,
        result: recorded?.result ?? 'parcial',
        mode: 'livre',
        xp: 0,
        aiFeedback: feedback,
      })
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e))
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => ctx.navigate(mode === 'diario' ? { name: 'dashboard' } : { name: 'library' })}>← Voltar</button>
      {mode === 'diario' && <h1>Problema do dia</h1>}
      <div className="card">
        <ProblemMeta problem={problem} />
        <ProblemStatement
          problem={problem}
          selectedChoice={choice}
          onSelectChoice={!revealed && isMC ? setChoice : undefined}
          showAnswer={revealed}
        />
      </div>

      {!isMC && (
        <div className="card">
          <SolutionEditor value={text} onChange={setText} disabled={revealed && !!recorded} />
        </div>
      )}

      {!revealed && (
        <div className="action-row">
          {isMC ? (
            <button className="btn btn-primary" disabled={!choice} onClick={revealMC}>
              Confirmar alternativa {choice ?? ''}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setRevealed(true)}>
              Revelar solução oficial
            </button>
          )}
        </div>
      )}

      {revealed && (
        <div className="card solution-card">
          <h2>Solução</h2>
          {problem.answer && <p><strong>Resposta:</strong> <Katex text={problem.answer} className="inline-math" /></p>}
          <Katex text={problem.solution} />
          {problem.solutionSource === 'ai' && (
            <p className="muted small">Solução redigida por IA (a oficial não estava disponível) — confira com espírito crítico.</p>
          )}
        </div>
      )}

      {revealed && !recorded && !isMC && (
        <div className="card eval-card">
          <h3>Como foi sua solução?</h3>
          <p className="muted">Compare com a oficial e avalie com honestidade — tentativa honesta mantém o streak; acerto vale mais XP.</p>
          <div className="action-row">
            <button className="btn btn-success" onClick={() => record('correto')}>✓ Acertei</button>
            <button className="btn btn-warning" onClick={() => record('parcial')}>½ Parcial</button>
            <button className="btn btn-danger" onClick={() => record('errado')}>✗ Errei</button>
          </div>
        </div>
      )}

      {recorded && (
        <div className={`card result-card result-${recorded.result}`}>
          <strong>
            {recorded.result === 'correto' ? '🎉 Correto!' : recorded.result === 'parcial' ? '💪 Parcial' : '📖 Registrado'}
          </strong>{' '}
          +{recorded.xp} XP{mode === 'diario' && !alreadyDoneToday ? ' (bônus do dia incluído)' : ''}
        </div>
      )}

      {revealed && (
        <div className="card ai-card">
          <h3>Correção por IA</h3>
          {ctx.progress.settings.apiKey ? (
            <>
              <p className="muted">Envia sua tentativa para o Claude avaliar como uma banca (nota estilo IMO 0–7).</p>
              <button className="btn" disabled={aiLoading || (!text && !choice)} onClick={askAi}>
                {aiLoading ? 'Corrigindo…' : 'Pedir correção à IA'}
              </button>
              {aiError && <p className="error-text">{aiError}</p>}
              {aiFeedback && <div className="ai-feedback"><Katex text={aiFeedback} /></div>}
            </>
          ) : (
            <p className="muted">Configure sua chave da API Anthropic em ⚙ Configurações para habilitar.</p>
          )}
        </div>
      )}

      {pastAttempts.length > 0 && !recorded && (
        <div className="muted small">Você já tentou este problema {pastAttempts.length}x (melhor: {pastAttempts.map((a) => a.result).includes('correto') ? 'correto' : pastAttempts.map((a) => a.result).includes('parcial') ? 'parcial' : 'errado'}).</div>
      )}
    </div>
  )
}
