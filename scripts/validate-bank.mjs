// Valida o banco de problemas/provas e regenera public/data/manifest.json.
// Uso: node scripts/validate-bank.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'public', 'data')
const problemsDir = join(dataDir, 'problems')
const examsDir = join(dataDir, 'exams')

const OLYMPIADS = ['OBMEP', 'OBM', 'IMO', 'ConeSul', 'Ibero', 'Autoral']
const TOPICS = ['algebra', 'geometria', 'combinatoria', 'teoria-numeros']
const errors = []
const warnings = []

function listJson(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
}

function loadJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    errors.push(`${label}: JSON inválido — ${e.message}`)
    return null
  }
}

function balancedDollars(s) {
  // Símbolos de moeda (R$, Cz$, NCz$, CR$) não contam como delimitador de math
  const cleaned = (s || '').replace(/(^|[^$\w\\])(NCz|Cz|CR|R)\$/g, '$1$2')
  return (cleaned.match(/\$/g) || []).length % 2 === 0
}

const problemFiles = listJson(problemsDir)
const examFiles = listJson(examsDir)
const allIds = new Set()
const problemShards = []
let totalProblems = 0

for (const file of problemFiles) {
  const arr = loadJson(join(problemsDir, file), `problems/${file}`)
  if (!Array.isArray(arr)) {
    if (arr !== null) errors.push(`problems/${file}: esperado um array`)
    continue
  }
  for (const p of arr) {
    const label = `problems/${file} :: ${p.id ?? '(sem id)'}`
    if (!p.id || typeof p.id !== 'string') errors.push(`${label}: id ausente`)
    else if (allIds.has(p.id)) errors.push(`${label}: id duplicado`)
    else allIds.add(p.id)
    if (!['real', 'autoral'].includes(p.source)) errors.push(`${label}: source inválido (${p.source})`)
    if (!OLYMPIADS.includes(p.olympiad)) errors.push(`${label}: olympiad inválida (${p.olympiad})`)
    if (![1, 2, 3, 4, 5].includes(p.difficulty)) errors.push(`${label}: difficulty inválida (${p.difficulty})`)
    if (!TOPICS.includes(p.topic)) errors.push(`${label}: topic inválido (${p.topic})`)
    if (!['pt', 'en'].includes(p.language)) errors.push(`${label}: language inválida (${p.language})`)
    if (!['multiple-choice', 'open'].includes(p.type)) errors.push(`${label}: type inválido (${p.type})`)
    if (!p.statement || p.statement.length < 10) errors.push(`${label}: statement ausente ou curto demais`)
    if (!p.solution || p.solution.length < 20) errors.push(`${label}: solution ausente ou curta demais`)
    if (p.type === 'multiple-choice') {
      if (!Array.isArray(p.choices) || p.choices.length !== 5) errors.push(`${label}: MC precisa de 5 choices`)
      if (!['A', 'B', 'C', 'D', 'E'].includes(p.answer)) errors.push(`${label}: MC precisa de answer A–E (${p.answer})`)
    }
    if (!balancedDollars(p.statement)) warnings.push(`${label}: $ desbalanceado no statement`)
    if (!balancedDollars(p.solution)) warnings.push(`${label}: $ desbalanceado na solution`)
    if (p.figureSvg && !p.figureSvg.trim().startsWith('<svg')) errors.push(`${label}: figureSvg não começa com <svg`)
  }
  problemShards.push({ file: `problems/${file}`, count: arr.length })
  totalProblems += arr.length
}

const examShards = []
let totalExams = 0
for (const file of examFiles) {
  const arr = loadJson(join(examsDir, file), `exams/${file}`)
  if (!Array.isArray(arr)) {
    if (arr !== null) errors.push(`exams/${file}: esperado um array`)
    continue
  }
  const examIds = new Set()
  for (const e of arr) {
    const label = `exams/${file} :: ${e.id ?? '(sem id)'}`
    if (!e.id) errors.push(`${label}: id ausente`)
    else if (examIds.has(e.id)) errors.push(`${label}: id duplicado no arquivo`)
    else examIds.add(e.id)
    if (!e.title) errors.push(`${label}: title ausente`)
    if (typeof e.officialTimeMinutes !== 'number' || e.officialTimeMinutes <= 0) errors.push(`${label}: officialTimeMinutes inválido`)
    if (!Array.isArray(e.problemIds) || e.problemIds.length === 0) errors.push(`${label}: problemIds vazio`)
    else {
      for (const pid of e.problemIds) {
        if (!allIds.has(pid)) errors.push(`${label}: referencia problema inexistente "${pid}"`)
      }
    }
  }
  examShards.push({ file: `exams/${file}` })
  totalExams += arr.length
}

const manifest = { problemShards, examShards }
writeFileSync(join(dataDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')

console.log(`Banco: ${totalProblems} problemas em ${problemFiles.length} shards; ${totalExams} provas em ${examFiles.length} arquivos.`)
console.log('manifest.json regenerado.')
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} aviso(s):`)
  for (const w of warnings.slice(0, 30)) console.log('  - ' + w)
  if (warnings.length > 30) console.log(`  ... e mais ${warnings.length - 30}`)
}
if (errors.length) {
  console.error(`\n✗ ${errors.length} erro(s):`)
  for (const e of errors.slice(0, 60)) console.error('  - ' + e)
  if (errors.length > 60) console.error(`  ... e mais ${errors.length - 60}`)
  process.exit(1)
}
console.log('\n✓ Validação OK')
