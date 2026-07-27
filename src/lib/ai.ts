import Anthropic from '@anthropic-ai/sdk'
import type { Problem } from '../types'

/**
 * Correção por IA: envia enunciado + solução oficial + tentativa do usuário
 * para a API Anthropic (chamada direta do navegador, chave do próprio usuário)
 * e retorna feedback estilo banca em PT-BR.
 */
export async function gradeSolution(
  problem: Problem,
  userSolution: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const prompt = [
    'Você é um corretor experiente de olimpíadas de matemática (banca da OBM/IMO).',
    'Avalie a solução do estudante para o problema abaixo. Responda em português do Brasil.',
    '',
    '## Problema',
    problem.statement,
    problem.choices ? '\nAlternativas:\n' + problem.choices.map((c, i) => `${'ABCDE'[i]}) ${c}`).join('\n') : '',
    '',
    '## Solução oficial (referência)',
    problem.solution,
    '',
    '## Solução do estudante',
    userSolution,
    '',
    '## Instruções de correção',
    'Dê feedback como uma banca: (1) pontos fortes; (2) furos lógicos ou passos não justificados; (3) o que faltou para a solução completa; (4) nota de 0 a 7 no estilo IMO, com justificativa breve.',
    'Se a abordagem do estudante for diferente da oficial mas válida, avalie-a nos próprios méritos.',
    'Use $...$ para fórmulas matemáticas (LaTeX). Seja encorajador mas honesto.',
  ].join('\n')

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  if (response.stop_reason === 'refusal') {
    throw new Error('A correção foi recusada pelos classificadores de segurança do modelo.')
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
  if (!text) throw new Error('Resposta vazia do modelo.')
  return text
}
