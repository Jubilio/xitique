'use server'

/**
 * Função de Validação Automática de Comprovativos (OCR via IA)
 * 
 * NOTA: Esta função contém o modo Simulação Realista activo para portefólio.
 * Para usar uma API real (ex: OpenAI Vision ou Gemini), substituir o timeout
 * pela chamada real à API recebendo `base64Image`.
 */
export async function analisarComprovativo(
  base64Image: string,
  valorEsperado: number
): Promise<{
  sucesso: boolean
  dadosExtraidos?: {
    valor: number
    data: string
    transacaoId: string
    metodo: string
  }
  mensagem?: string
  confianca?: number
}> {
  // Simular latência realista de processamento de IA (2.5 a 4 segundos)
  const delay = Math.floor(Math.random() * 1500) + 2500
  await new Promise(resolve => setTimeout(resolve, delay))

  // Num cenário real, enviaríamos `base64Image` para a API da OpenAI/Google
  // const response = await openai.chat.completions.create({ ... })
  
  // MODO SIMULAÇÃO: 
  // Na simulação, vamos assumir que o upload foi de um recibo válido e
  // fingir que a IA leu exactamente o valor esperado (para o happy path do utilizador).
  
  // Extrair a data actual formatada (YYYY-MM-DD)
  const hoje = new Date().toISOString().split('T')[0]
  
  // Gerar um ID de transacção aleatório realista estilo M-Pesa (ex: 8JH9K2M)
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let transacaoId = ''
  for (let i = 0; i < 8; i++) {
    transacaoId += charset.charAt(Math.floor(Math.random() * charset.length))
  }

  // Falha simulada aletória (5% de chance) para demonstração de robustez
  if (Math.random() < 0.05) {
    return {
      sucesso: false,
      mensagem: 'A imagem está desfocada ou não é um recibo válido. A IA não conseguiu ler os dados.'
    }
  }

  return {
    sucesso: true,
    dadosExtraidos: {
      valor: valorEsperado,
      data: hoje,
      transacaoId: transacaoId,
      metodo: 'M-Pesa'
    },
    confianca: 98.4,
    mensagem: 'Recibo analisado com sucesso e valores coincidem.'
  }
}
