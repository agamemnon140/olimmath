import type { Exam, Manifest, Problem, Settings } from '../types'

let manifest: Manifest | null = null
const shardCache = new Map<string, Problem[]>()
let allProblems: Problem[] | null = null
let allExams: Exam[] | null = null

const base = import.meta.env.BASE_URL + 'data/'

export async function loadManifest(): Promise<Manifest> {
  if (manifest) return manifest
  const res = await fetch(base + 'manifest.json')
  if (!res.ok) throw new Error('Falha ao carregar manifest.json')
  manifest = (await res.json()) as Manifest
  return manifest
}

async function loadShard(file: string): Promise<Problem[]> {
  const cached = shardCache.get(file)
  if (cached) return cached
  const res = await fetch(base + file)
  if (!res.ok) throw new Error(`Falha ao carregar shard ${file}`)
  const problems = (await res.json()) as Problem[]
  shardCache.set(file, problems)
  return problems
}

export async function loadAllProblems(): Promise<Problem[]> {
  if (allProblems) return allProblems
  const m = await loadManifest()
  const shards = await Promise.all(m.problemShards.map((s) => loadShard(s.file)))
  allProblems = shards.flat().sort((a, b) => a.id.localeCompare(b.id))
  return allProblems
}

export async function loadAllExams(): Promise<Exam[]> {
  if (allExams) return allExams
  const m = await loadManifest()
  const shards = await Promise.all(
    m.examShards.map(async (s) => {
      const res = await fetch(base + s.file)
      if (!res.ok) throw new Error(`Falha ao carregar prova ${s.file}`)
      return (await res.json()) as Exam[]
    }),
  )
  allExams = shards.flat().sort((a, b) => a.id.localeCompare(b.id))
  return allExams
}

export async function getProblem(id: string): Promise<Problem | undefined> {
  const problems = await loadAllProblems()
  return problems.find((p) => p.id === id)
}

export function filterBySources(problems: Problem[], settings: Settings): Problem[] {
  return problems.filter((p) => settings.sourcesEnabled[p.source])
}
