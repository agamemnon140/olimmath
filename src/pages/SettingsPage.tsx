import { useRef, useState } from 'react'
import type { AppContext } from '../App'
import type { Difficulty } from '../types'
import { exportProgress, importProgress } from '../lib/progress'

export default function SettingsPage({ ctx }: { ctx: AppContext }) {
  const { progress, setSettings, replaceProgress } = ctx
  const s = progress.settings
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  function download() {
    const blob = new Blob([exportProgress(progress)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `olimmath-progresso-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImportFile(file: File) {
    try {
      const text = await file.text()
      replaceProgress(importProgress(text))
      setMessage('Progresso importado com sucesso.')
    } catch (e) {
      setMessage(`Falha ao importar: ${e instanceof Error ? e.message : e}`)
    }
  }

  return (
    <div className="page settings-page">
      <h1>Configurações</h1>

      <div className="card">
        <h2>Fontes de problemas</h2>
        <p className="muted">Desabilite uma fonte para escondê-la do banco, do problema do dia e das provas típicas.</p>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={s.sourcesEnabled.real}
            onChange={(e) => setSettings({ ...s, sourcesEnabled: { ...s.sourcesEnabled, real: e.target.checked } })}
          />
          Problemas reais (provas oficiais)
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={s.sourcesEnabled.autoral}
            onChange={(e) => setSettings({ ...s, sourcesEnabled: { ...s.sourcesEnabled, autoral: e.target.checked } })}
          />
          Problemas autorais (gerados por IA)
        </label>
      </div>

      <div className="card">
        <h2>Problema do dia</h2>
        <p className="muted">Faixa de dificuldade do sorteio diário.</p>
        <div className="range-row">
          <label>
            Mínima:{' '}
            <select value={s.dailyMinDifficulty} onChange={(e) => setSettings({ ...s, dailyMinDifficulty: Number(e.target.value) as Difficulty })}>
              {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{'★'.repeat(d)}</option>)}
            </select>
          </label>
          <label>
            Máxima:{' '}
            <select value={s.dailyMaxDifficulty} onChange={(e) => setSettings({ ...s, dailyMaxDifficulty: Number(e.target.value) as Difficulty })}>
              {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{'★'.repeat(d)}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="card">
        <h2>Correção por IA</h2>
        <p className="muted">
          Sua chave fica somente no navegador (localStorage) e é usada para chamar a API da Anthropic diretamente.
          Crie uma em console.anthropic.com.
        </p>
        <label className="field-row">
          Chave da API:{' '}
          <input
            type="password"
            value={s.apiKey}
            placeholder="sk-ant-..."
            onChange={(e) => setSettings({ ...s, apiKey: e.target.value })}
          />
        </label>
        <label className="field-row">
          Modelo:{' '}
          <select value={s.model} onChange={(e) => setSettings({ ...s, model: e.target.value })}>
            <option value="claude-opus-5">Claude Opus 5 (recomendado)</option>
            <option value="claude-sonnet-5">Claude Sonnet 5 (mais barato)</option>
            <option value="claude-haiku-4-5">Claude Haiku 4.5 (mais rápido)</option>
          </select>
        </label>
      </div>

      <div className="card">
        <h2>Backup do progresso</h2>
        <div className="action-row">
          <button className="btn" onClick={download}>Exportar JSON</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Importar JSON</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && onImportFile(e.target.files[0])}
          />
        </div>
        {message && <p className="muted">{message}</p>}
      </div>
    </div>
  )
}
