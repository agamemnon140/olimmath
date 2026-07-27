import Katex from './Katex'

interface Props {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export default function SolutionEditor({ value, onChange, disabled }: Props) {
  return (
    <div className="editor-grid">
      <div>
        <div className="editor-label">Sua solução (use $...$ para fórmulas)</div>
        <textarea
          className="editor-textarea"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={'Descreva sua solução aqui...\n\nEx.: Seja $n$ o número procurado. Então $n^2 + 1$ é...'}
          spellCheck={false}
        />
      </div>
      <div>
        <div className="editor-label">Pré-visualização</div>
        <div className="editor-preview">
          {value ? <Katex text={value} /> : <span className="muted">A pré-visualização aparece aqui.</span>}
        </div>
      </div>
    </div>
  )
}
