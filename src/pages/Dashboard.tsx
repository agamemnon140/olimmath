import type { AppContext } from '../App'
import { dailyProblem } from '../lib/daily'
import { effectiveStreak, todayKey } from '../lib/streak'
import { levelForXp } from '../lib/xp'
import { ProblemMeta } from '../components/ProblemView'
import { ACHIEVEMENTS } from '../lib/achievements'

export default function Dashboard({ ctx }: { ctx: AppContext }) {
  const { progress, problems, navigate } = ctx
  const today = todayKey()
  const daily = dailyProblem(problems, progress.settings, today)
  const dailyDone = progress.attempts.some((a) => a.mode === 'diario' && a.date === today)
  const streak = effectiveStreak(progress.streak)
  const { level, next, progress: levelProgress } = levelForXp(progress.xp)
  const attempted = new Set(progress.attempts.map((a) => a.problemId)).size

  return (
    <div className="page">
      <div className="stats-row">
        <div className="card stat-card">
          <div className="stat-value">🔥 {streak}</div>
          <div className="stat-label">dias seguidos{progress.streak.best > 0 ? ` · recorde ${progress.streak.best}` : ''}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">⭐ {progress.xp} XP</div>
          <div className="stat-label">
            {level.name}
            {next && ` · ${next.minXp - progress.xp} XP até ${next.name}`}
          </div>
          <div className="xp-bar"><div className="xp-fill" style={{ width: `${Math.round(levelProgress * 100)}%` }} /></div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">📚 {attempted}</div>
          <div className="stat-label">de {problems.length} problemas tentados</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">🏅 {progress.achievements.length}</div>
          <div className="stat-label">de {ACHIEVEMENTS.length} medalhas</div>
        </div>
      </div>

      <div className="card daily-card">
        <div className="daily-header">
          <h2>Problema do dia</h2>
          {dailyDone && <span className="badge badge-done">✓ feito hoje</span>}
        </div>
        {daily ? (
          <>
            <ProblemMeta problem={daily} />
            <p className="muted">
              {dailyDone
                ? 'Você já garantiu o streak de hoje. Pode revisitar o problema ou explorar o banco.'
                : 'Resolva o problema de hoje para manter o streak. Tentativa honesta conta; acerto vale bônus de 50% de XP.'}
            </p>
            <button className="btn btn-primary" onClick={() => navigate({ name: 'problem', id: daily.id, mode: 'diario' })}>
              {dailyDone ? 'Rever problema do dia' : 'Resolver agora'}
            </button>
          </>
        ) : (
          <p className="muted">Nenhum problema elegível com os filtros atuais — ajuste as configurações.</p>
        )}
      </div>

      <div className="quick-row">
        <button className="card quick-card" onClick={() => navigate({ name: 'library' })}>
          <span className="quick-icon">📖</span>
          <strong>Explorar problemas</strong>
          <span className="muted">Filtre por olimpíada, tema e nível</span>
        </button>
        <button className="card quick-card" onClick={() => navigate({ name: 'examSetup' })}>
          <span className="quick-icon">📝</span>
          <strong>Fazer uma prova</strong>
          <span className="muted">Provas reais ou típicas geradas</span>
        </button>
        <button className="card quick-card" onClick={() => navigate({ name: 'achievements' })}>
          <span className="quick-icon">🏅</span>
          <strong>Medalhas</strong>
          <span className="muted">Suas conquistas</span>
        </button>
      </div>
    </div>
  )
}
