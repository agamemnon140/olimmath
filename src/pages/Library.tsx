import { useMemo, useState } from 'react'
import type { AppContext } from '../App'
import type { Olympiad, Topic } from '../types'
import { TOPIC_LABELS } from '../types'
import { filterBySources } from '../lib/bank'
import { bestResultFor } from '../lib/progress'

const OLYMPIADS: (Olympiad | 'todas')[] = ['todas', 'OBM', 'OBMEP', 'IMO', 'ConeSul', 'Ibero', 'Autoral']
const TOPICS: (Topic | 'todos')[] = ['todos', 'algebra', 'geometria', 'combinatoria', 'teoria-numeros']
const STATUS = ['todos', 'não tentados', 'acertados', 'errados/parciais'] as const

export default function Library({ ctx }: { ctx: AppContext }) {
  const { problems, progress, navigate } = ctx
  const [olympiad, setOlympiad] = useState<(typeof OLYMPIADS)[number]>('todas')
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>('todos')
  const [difficulty, setDifficulty] = useState<number>(0)
  const [status, setStatus] = useState<(typeof STATUS)[number]>('todos')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = filterBySources(problems, progress.settings)
    if (olympiad !== 'todas') list = list.filter((p) => p.olympiad === olympiad)
    if (topic !== 'todos') list = list.filter((p) => p.topic === topic)
    if (difficulty > 0) list = list.filter((p) => p.difficulty === difficulty)
    if (status !== 'todos') {
      list = list.filter((p) => {
        const best = bestResultFor(progress, p.id)
        if (status === 'não tentados') return !best
        if (status === 'acertados') return best?.result === 'correto'
        return best && best.result !== 'correto'
      })
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.statement.toLowerCase().includes(q) || p.id.includes(q))
    }
    return list
  }, [problems, progress, olympiad, topic, difficulty, status, search])

  return (
    <div className="page">
      <h1>Banco de problemas</h1>
      <div className="filters card">
        <select value={olympiad} onChange={(e) => setOlympiad(e.target.value as typeof olympiad)}>
          {OLYMPIADS.map((o) => <option key={o} value={o}>{o === 'todas' ? 'Todas as olimpíadas' : o}</option>)}
        </select>
        <select value={topic} onChange={(e) => setTopic(e.target.value as typeof topic)}>
          {TOPICS.map((t) => <option key={t} value={t}>{t === 'todos' ? 'Todos os temas' : TOPIC_LABELS[t]}</option>)}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
          <option value={0}>Qualquer dificuldade</option>
          {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{'★'.repeat(d)}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="search" placeholder="Buscar no enunciado…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="muted list-count">{filtered.length} problema{filtered.length === 1 ? '' : 's'}</div>

      <div className="problem-list">
        {filtered.map((p) => {
          const best = bestResultFor(progress, p.id)
          return (
            <button key={p.id} className="card problem-row" onClick={() => navigate({ name: 'problem', id: p.id, mode: 'livre' })}>
              <div className="problem-row-top">
                <span className="badge badge-olympiad">{p.olympiad}{p.year ? ` ${p.year}` : ''}</span>
                {p.originalLevel && <span className="badge">{p.originalLevel}{p.originalNumber ? ` · Q${p.originalNumber}` : ''}</span>}
                <span className="badge">{TOPIC_LABELS[p.topic]}</span>
                <span className="badge badge-diff">{'★'.repeat(p.difficulty)}</span>
                {best && (
                  <span className={`badge badge-status-${best.result}`}>
                    {best.result === 'correto' ? '✓' : best.result === 'parcial' ? '½' : '✗'}
                  </span>
                )}
              </div>
              <div className="problem-row-preview">{p.statement.replace(/\$[^$]*\$/g, '···').slice(0, 160)}…</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
