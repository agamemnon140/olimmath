import type { AppContext } from '../App'
import { ACHIEVEMENTS } from '../lib/achievements'

export default function Achievements({ ctx }: { ctx: AppContext }) {
  const earned = new Set(ctx.progress.achievements)
  return (
    <div className="page">
      <h1>Medalhas</h1>
      <p className="muted">{earned.size} de {ACHIEVEMENTS.length} conquistadas</p>
      <div className="achievement-grid">
        {ACHIEVEMENTS.map((a) => {
          const has = earned.has(a.id)
          return (
            <div key={a.id} className={`card achievement-card ${has ? 'earned' : 'locked'}`}>
              <span className="achievement-icon">{has ? a.icon : '🔒'}</span>
              <strong>{a.title}</strong>
              <span className="muted small">{a.description}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
