# OlimMath

App local de treino para olimpíadas de matemática (OBMEP, OBM, IMO, Cone Sul, Ibero-americana). SPA Vite + React + TypeScript, sem backend: banco de problemas em JSON estático, progresso do usuário em localStorage.

## Comandos

```sh
npm run dev        # servidor de desenvolvimento
npm run build      # tsc -b + vite build
npm run validate   # valida o banco e REGENERA public/data/manifest.json
```

**Sempre rode `npm run validate` depois de mexer em qualquer JSON de `public/data/`** — ele checa schema, ids duplicados, gabaritos, LaTeX desbalanceado e referências de provas, e reescreve o manifest (o app carrega os shards a partir dele).

## Arquitetura

- `src/lib/bank.ts` — carrega `public/data/manifest.json` e os shards sob demanda (fetch); filtro por fonte (real/autoral) respeitando as configurações do usuário.
- `src/lib/progress.ts` — persistência em localStorage (chave `olimmath-progress`): tentativas, streak, XP, medalhas, configurações; export/import JSON.
- `src/lib/streak.ts` / `xp.ts` / `achievements.ts` / `daily.ts` — regras de gamificação (ver abaixo).
- `src/lib/examGen.ts` — templates de "prova típica" por olimpíada/nível; sorteia do banco.
- `src/lib/ai.ts` — correção por IA via `@anthropic-ai/sdk` direto do navegador (`dangerouslyAllowBrowser`), chave do usuário nas configurações. Modelo padrão `claude-opus-5`.
- `src/pages/` — Dashboard, Library, ProblemPage, ExamSetup, ExamPage, Achievements, SettingsPage. Roteamento por estado em `App.tsx` (union `View`).
- `src/components/Katex.tsx` — renderiza texto com `$...$` (inline) e `$$...$$` (bloco) via KaTeX; suporta `**negrito**` e parágrafos.

## Banco de dados (public/data/)

```
manifest.json              # gerado pelo validate — NÃO editar à mão
problems/<shard>.json      # arrays de Problem, particionados por origem (obm-2001.json, imo.json, ...)
exams/<shard>.json         # arrays de Exam (provas específicas reais)
```

### Schema de Problem (ver `src/types.ts`)

```json
{
  "id": "obm-2001-f1-n1-q5",
  "source": "real | autoral",
  "olympiad": "OBMEP | OBM | IMO | ConeSul | Ibero | Autoral",
  "year": 2001, "originalLevel": "N1-F1", "originalNumber": 5,
  "difficulty": 2,
  "topic": "algebra | geometria | combinatoria | teoria-numeros",
  "language": "pt | en",
  "type": "multiple-choice | open",
  "statement": "enunciado com $LaTeX$",
  "choices": ["5 itens sem prefixo de letra (só MC)"],
  "answer": "letra A-E (MC) ou resposta curta (open, opcional)",
  "solution": "solução completa com $LaTeX$",
  "solutionSource": "official | ai",
  "figureSvg": "<svg>...</svg> (opcional)",
  "figureNote": "descrição quando a figura não foi recriada (opcional)"
}
```

Convenções de id: `obm-YYYY-fF-nN-qQ`, `obmep-YYYY-nN-fF-qQ`, `imo-YYYY-pN`, `conesul-YYYY-pN`, `ibero-YYYY-pN`, `autoral-<topico>-NN`.

### Escala unificada de dificuldade (1–5)

1 ≈ OBMEP F1 fácil · 2 ≈ OBMEP/OBM F1 média · 3 ≈ OBM F2 / OBMEP F2 difícil · 4 ≈ OBM F3 / IMO P1/P4 · 5 ≈ IMO P3/P6.

### Idioma

Olimpíadas nacionais em PT-BR; internacionais (IMO/ConeSul/Ibero) no inglês original — decisão do usuário, não traduzir.

## Expandindo o banco (meta: 1000+ problemas)

1. Crie um novo shard em `public/data/problems/` (nunca gigante: ~50–100 problemas por arquivo) e, se for prova completa, o arquivo correspondente em `exams/`.
2. Problemas reais: transcreva de PDFs oficiais quando possível (há PDFs da OBM em `raw-pdfs/`, fora do git; script de extração de texto usado anteriormente: pdf-parse via node). Gabarito oficial manda no campo `answer`.
3. `npm run validate` para checar e atualizar o manifest.
4. Soluções com `solutionSource: "ai"` devem ser conferidas com espírito crítico; prefira `official` sempre que houver gabarito com solução.
5. Questões idênticas usadas em mais de um nível da mesma prova: um único Problem, referenciado por múltiplas provas.

## Gamificação (não mudar sem atualizar esta doc)

- XP base por dificuldade: 10/20/35/55/80. Multiplicador: correto ×1, parcial ×0.6, errado ×0.25 (tentativa honesta sempre pontua). Problema do dia: bônus ×1.5.
- Streak: conta com tentativa autoavaliada no problema do dia; vira à meia-noite local. Sem freeze.
- Níveis de perfil: Iniciante 0 → Escolar 100 → Regional 300 → Estadual 700 → Nacional 1500 → Internacional 3000 → Medalhista 6000 XP.
- Problema do dia: sorteio determinístico por data (hash FNV da string `olimmath-YYYY-MM-DD`) dentro da faixa de dificuldade configurada.
- Medalhas: definidas em `src/lib/achievements.ts` (streaks, temas, marcos, IMO, prova completa, IA).
