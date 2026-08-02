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

### Estado atual (02/08/2026)

366 problemas em 14 shards e 38 provas: OBM 2004 (99), OBM 2002 (78), OBM 2001 (68), OBMEP (41), IMO (25), Cone Sul/Ibero (15) e **o Nível 1 completo de 2018 a 2025** (7 provas × 5 problemas = 35). 210 soluções oficiais e 156 escritas (`ai`).

Distribuição por dificuldade: 28 / 105 / 113 / 89 / 31 (níveis 1 a 5). Por tema: teoria dos números 100, combinatória 92, álgebra 87, geometria 87. Repositório publicado em `github.com/agamemnon140/olimmath`.

### Material já baixado e fila de trabalho

`raw-pdfs/` (fora do git) tem os PDFs oficiais da **OBM 2018–2025, níveis 1 a 3** — 24 arquivos, baixados de `obm.org.br`, além dos de 2001/2002/2004. Ordem de trabalho sugerida:

O **Nível 1 de 2018 a 2025 está fechado**. Falta:

1. **OBMEP** (`obmep.org.br/provas.htm`) — a melhor fonte pendente: traz **provas e soluções oficiais**, o que entra no banco como `official` e reforça as dificuldades 1–3.
2. **OBM 2018–2025, níveis 2 e 3** — PDFs já em `raw-pdfs/`.
3. **IMO 2020–2025** — 36 problemas, em inglês.

Atenção: **a OBM não publica gabarito nem solução dos níveis 1–3 de 2018 em diante** (conferido em `obm.org.br/como-se-preparar/provas-e-gabaritos/` — só o nível Universitário tem gabarito). Toda solução daqui é autoral (`ai`).

Atenção ao esforço real: no formato atual (fase única, 5–6 problemas dissertativos por nível), os problemas de **N2 e N3 têm dificuldade de IMO**. Transcrever o enunciado é rápido; produzir solução correta não é. Não vale despejar solução malfeita no banco — melhor transcrever menos e conferir cada uma.

### Fluxo que funcionou para as provas modernas

1. **Renderizar as páginas do PDF em PNG e olhar as figuras.** `pdf-parse` embaralha fórmulas e ignora os desenhos; várias questões (tabuleiros, octógonos, o dado de 2020) são incompreensíveis sem a imagem. Instale `pdfjs-dist` + `@napi-rs/canvas` fora do repo e renderize com `page.render({canvasContext, viewport, canvas})`.
2. **Resolver e conferir cada resposta com um script de força bruta** antes de escrever a solução — simular o dado rolando, contar as coberturas do tabuleiro, enumerar as permutações. Isso já pegou erro de transcrição e erro de solução mais de uma vez, e de quebra valida a leitura da figura (em 2023, o item que o enunciado diz ter solução única só tem solução única se as peças estiverem nas posições transcritas).
3. **Recriar as figuras em SVG** no campo `figureSvg`, e conferir renderizando o SVG de volta para PNG. Cuidado com: elementos que estouram o `viewBox` e subscritos Unicode (use `<tspan font-size="9" dy="3">`).

### Convenções de id por formato

- provas antigas (1ª/2ª/3ª fases, até ~2017): `obm-YYYY-fF-nN-qQ`, `originalLevel` como `N1-F1`;
- formato atual (fase única, 2018 em diante): `obm-YYYY-fu-nN-qQ`, `originalLevel` como `N1-FU`.

## Expandindo o banco (meta: 1000+ problemas)

1. Crie um novo shard em `public/data/problems/` (nunca gigante: ~50–100 problemas por arquivo) e, se for prova completa, o arquivo correspondente em `exams/`.
2. Problemas reais: transcreva de PDFs oficiais quando possível (há PDFs da OBM em `raw-pdfs/`, fora do git). Para extrair o texto, `pdf-parse` v2 — API por classe, `new PDFParse({data: buffer})` + `await parser.getText()` —, instalado fora do repo para não sujar o `package.json`. Gabarito oficial manda no campo `answer`.
   - Nos PDFs da OBM, a **1ª fase** traz gabarito e "resumo das soluções" (às vezes dos três níveis no mesmo arquivo) e a **2ª fase** traz soluções completas; a **3ª fase** só traz enunciados — nesse caso a solução é escrita à mão e vai com `solutionSource: "ai"`.
   - A extração de texto embaralha fórmulas em Equation Editor; sempre reconstrua o LaTeX conferindo o resultado contra o gabarito.
3. `npm run validate` para checar e atualizar o manifest.
4. Soluções com `solutionSource: "ai"` devem ser conferidas com espírito crítico; prefira `official` sempre que houver gabarito com solução.
5. Questões idênticas usadas em mais de um nível da mesma prova: um único Problem, referenciado por múltiplas provas.

## Gamificação (não mudar sem atualizar esta doc)

- XP base por dificuldade: 10/20/35/55/80. Multiplicador: correto ×1, parcial ×0.6, errado ×0.25 (tentativa honesta sempre pontua). Problema do dia: bônus ×1.5.
- Streak: conta com tentativa autoavaliada no problema do dia; vira à meia-noite local. Sem freeze.
- Níveis de perfil: Iniciante 0 → Escolar 100 → Regional 300 → Estadual 700 → Nacional 1500 → Internacional 3000 → Medalhista 6000 XP.
- Problema do dia: sorteio determinístico por data (hash FNV da string `olimmath-YYYY-MM-DD`) dentro da faixa de dificuldade configurada.
- Medalhas: definidas em `src/lib/achievements.ts` (streaks, temas, marcos, IMO, prova completa, IA).
