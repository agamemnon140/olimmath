import type { Problem } from '../types'
import { TOPIC_LABELS } from '../types'
import Katex from './Katex'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

export function ProblemMeta({ problem }: { problem: Problem }) {
  return (
    <div className="problem-meta">
      <span className="badge badge-olympiad">{problem.olympiad}{problem.year ? ` ${problem.year}` : ''}</span>
      {problem.originalLevel && <span className="badge">{problem.originalLevel}</span>}
      <span className="badge">{TOPIC_LABELS[problem.topic]}</span>
      <span className="badge badge-diff">{'★'.repeat(problem.difficulty)}{'☆'.repeat(5 - problem.difficulty)}</span>
      <span className={`badge ${problem.source === 'real' ? 'badge-real' : 'badge-autoral'}`}>
        {problem.source === 'real' ? 'Prova real' : 'Autoral (IA)'}
      </span>
    </div>
  )
}

interface StatementProps {
  problem: Problem
  selectedChoice?: string | null
  onSelectChoice?: (letter: string) => void
  showAnswer?: boolean
}

export function ProblemStatement({ problem, selectedChoice, onSelectChoice, showAnswer }: StatementProps) {
  return (
    <div className="problem-statement">
      <Katex text={problem.statement} className="statement-text" />
      {problem.figureSvg && (
        <div className="figure" dangerouslySetInnerHTML={{ __html: problem.figureSvg }} />
      )}
      {problem.figureNote && <div className="figure-note">📌 {problem.figureNote}</div>}
      {problem.choices && (
        <div className="choices">
          {problem.choices.map((choice, i) => {
            const letter = LETTERS[i]
            const isSelected = selectedChoice === letter
            const isCorrect = showAnswer && problem.answer === letter
            const isWrong = showAnswer && isSelected && problem.answer !== letter
            return (
              <button
                key={letter}
                className={`choice ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => onSelectChoice?.(letter)}
                disabled={!onSelectChoice}
              >
                <span className="choice-letter">{letter}</span>
                <Katex text={choice} className="choice-text" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
