import katex from 'katex'
import 'katex/dist/katex.min.css'

type Segment = { kind: 'text' | 'inline' | 'block'; content: string }

// Símbolos de moeda (R$, Cz$, NCz$, CR$) não são delimitadores de math —
// protegidos antes de tokenizar para o $ solto não parear com math adiante.
const CURRENCY_SENTINEL = ''

function protectCurrency(src: string): string {
  return src.replace(/(^|[^$\w\\])(NCz|Cz|CR|R)\$/g, '$1$2' + CURRENCY_SENTINEL)
}

function restoreCurrency(html: string): string {
  return html.split(CURRENCY_SENTINEL).join('$')
}

function tokenize(src: string): Segment[] {
  const segments: Segment[] = []
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) segments.push({ kind: 'text', content: src.slice(last, m.index) })
    if (m[1] !== undefined) segments.push({ kind: 'block', content: m[1] })
    else segments.push({ kind: 'inline', content: m[2] })
    last = re.lastIndex
  }
  if (last < src.length) segments.push({ kind: 'text', content: src.slice(last) })
  return segments
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function textToHtml(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

export function mathToHtml(src: string): string {
  const html = tokenize(protectCurrency(src))
    .map((seg) => {
      if (seg.kind === 'text') return textToHtml(seg.content)
      try {
        return katex.renderToString(seg.content, {
          displayMode: seg.kind === 'block',
          throwOnError: false,
        })
      } catch {
        return escapeHtml('$' + seg.content + '$')
      }
    })
    .join('')
  return restoreCurrency(`<p>${html}</p>`)
}

export default function Katex({ text, className }: { text: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: mathToHtml(text) }} />
}
