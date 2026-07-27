import { useMemo, useState } from 'react'
import type { AppContext } from '../App'
import { EXAM_TEMPLATES, generateExam } from '../lib/examGen'
import { filterBySources } from '../lib/bank'

export default function ExamSetup({ ctx }: { ctx: AppContext }) {
  const { exams, problems, progress, navigate } = ctx
  const [error, setError] = useState<string | null>(null)

  const availableExams = useMemo(() => {
    const enabled = new Set(filterBySources(problems, progress.settings).map((p) => p.id))
    return exams.map((e) => ({
      exam: e,
      available: e.problemIds.filter((id) => enabled.has(id)).length,
    }))
  }, [exams, problems, progress.settings])

  function startTemplate(templateId: string) {
    const template = EXAM_TEMPLATES.find((t) => t.id === templateId)!
    const exam = generateExam(template, problems, progress.settings)
    if (!exam) {
      setError('Não há problemas suficientes no banco (com os filtros atuais) para gerar essa prova.')
      return
    }
    navigate({ name: 'exam', exam })
  }

  return (
    <div className="page">
      <h1>Provas</h1>
      {error && <div className="card error-card">{error}</div>}

      <h2>Provas específicas (reais)</h2>
      <p className="muted">Provas completas transcritas dos originais, corrigidas contra o gabarito oficial.</p>
      <div className="exam-grid">
        {availableExams.map(({ exam, available }) => (
          <div key={exam.id} className="card exam-card">
            <strong>{exam.title}</strong>
            <div className="muted">
              {exam.problemIds.length} questões · tempo oficial: {formatMinutes(exam.officialTimeMinutes)}
              {available < exam.problemIds.length && ` · ${available}/${exam.problemIds.length} disponíveis com os filtros atuais`}
            </div>
            {exam.description && <div className="muted small">{exam.description}</div>}
            <button className="btn btn-primary" disabled={available === 0} onClick={() => navigate({ name: 'exam', exam })}>
              Iniciar prova
            </button>
          </div>
        ))}
        {exams.length === 0 && <div className="muted">Nenhuma prova específica no banco ainda.</div>}
      </div>

      <h2>Provas típicas (geradas)</h2>
      <p className="muted">Sorteadas do banco no formato da olimpíada escolhida. Sem limite de tempo — o tempo oficial é exibido como referência.</p>
      <div className="exam-grid">
        {EXAM_TEMPLATES.map((t) => (
          <div key={t.id} className="card exam-card">
            <strong>{t.title}</strong>
            <div className="muted">
              {t.numQuestions} questões {t.type === 'multiple-choice' ? 'de múltipla escolha' : t.type === 'open' ? 'dissertativas' : ''} · tempo oficial: {formatMinutes(t.officialTimeMinutes)}
            </div>
            <button className="btn" onClick={() => startTemplate(t.id)}>Gerar e iniciar</button>
          </div>
        ))}
      </div>

      {progress.examResults.length > 0 && (
        <>
          <h2>Histórico</h2>
          <div className="card">
            <table className="history-table">
              <thead>
                <tr><th>Prova</th><th>Data</th><th>Resultado</th><th>Tempo</th></tr>
              </thead>
              <tbody>
                {[...progress.examResults].reverse().map((r, i) => (
                  <tr key={i}>
                    <td>{r.title}</td>
                    <td>{r.date}</td>
                    <td>{r.correct}✓ {r.partial}½ {r.wrong}✗ de {r.total}</td>
                    <td>{formatSeconds(r.elapsedSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`
}

export function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}
