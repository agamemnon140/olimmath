# Σ OlimMath

Treino pessoal para olimpíadas de matemática — OBMEP, OBM, IMO, Cone Sul e Ibero-americana.

**▶ [Acessar o app](https://agamemnon140.github.io/olimmath/)** — publicado no GitHub Pages a cada push na `main`.

No iPhone, abra o link no Safari e use *Compartilhar → Adicionar à Tela de Início*: o app abre em tela cheia, com ícone próprio. O progresso fica salvo no navegador do aparelho.

## Recursos

- **Banco de problemas** com provas reais transcritas dos PDFs oficiais (OBM 2001/2002/2004 completas) e problemas autorais gerados por IA, com filtro para habilitar/desabilitar cada fonte.
- **Espaço para escrever sua solução** com LaTeX (`$...$`) e pré-visualização, antes de revelar a solução oficial.
- **Autoavaliação** (acertei / parcial / errei) — múltipla escolha é corrigida automaticamente pelo gabarito.
- **Correção por IA** opcional: o Claude avalia sua solução dissertativa como uma banca (nota 0–7 estilo IMO). Requer sua chave da API Anthropic.
- **Modo prova**: provas específicas reais (ex.: OBM 2002 Nível 3, IMO 2019) ou provas típicas geradas no formato da olimpíada. Sem limite de tempo, mas com o tempo oficial da banca exibido.
- **Problema do dia + streak**: tentativa honesta mantém a sequência; acerto vale bônus de XP.
- **XP, níveis de perfil e medalhas**.
- Progresso salvo no navegador, com exportar/importar JSON.

## Rodando

```sh
npm install
npm run dev
```

Abra o endereço indicado (padrão http://localhost:5173).

## Manutenção do banco

Ver [CLAUDE.md](CLAUDE.md). Resumo: edite os JSON em `public/data/`, rode `npm run validate`.
