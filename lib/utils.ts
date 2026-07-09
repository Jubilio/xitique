import type { MetodoRecebimento, FrequenciaGrupo } from './types'

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor) + ' MT'
}

export function formatarData(data: string | Date): string {
  return new Intl.DateTimeFormat('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(data))
}

export function formatarDataHora(data: string | Date): string {
  return new Intl.DateTimeFormat('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data))
}

export function labelMetodo(metodo: MetodoRecebimento): string {
  const labels: Record<MetodoRecebimento, string> = {
    mpesa: 'M-Pesa',
    emola: 'e-Mola',
    banco: 'Banco',
    dinheiro: 'Dinheiro',
  }
  return labels[metodo] ?? metodo
}

export function labelFrequencia(freq: FrequenciaGrupo): string {
  const labels: Record<FrequenciaGrupo, string> = {
    semanal: 'Semanal',
    quinzenal: 'Quinzenal',
    mensal: 'Mensal',
  }
  return labels[freq] ?? freq
}

export function gerarLembreteWhatsapp(params: {
  nomeIntegrante: string
  nomeGrupo: string
  valorContribuicao: number
  nomeRonda: string
  tipo: 'lembrete' | 'confirmacao' | 'beneficiario'
  valorTotal?: number
}): string {
  const { nomeIntegrante, nomeGrupo, valorContribuicao, nomeRonda, tipo, valorTotal } = params
  const valor = formatarMoeda(valorContribuicao)
  const total = valorTotal ? formatarMoeda(valorTotal) : ''

  switch (tipo) {
    case 'lembrete':
      return `Olá, ${nomeIntegrante}. 👋\n\nLembrete do *${nomeGrupo}*: a sua contribuição de *${valor}* para a ronda de *${nomeRonda}* está pendente.\n\nPor favor envie o comprovativo após o pagamento. Obrigado! 🙏`
    case 'confirmacao':
      return `✅ *Pagamento confirmado!*\n\nOlá, ${nomeIntegrante}. A sua contribuição de *${valor}* foi registada com sucesso no *${nomeGrupo}* — ronda de ${nomeRonda}. Obrigado! 🙏`
    case 'beneficiario':
      return `🎉 *Parabéns, ${nomeIntegrante}!*\n\nNesta ronda (${nomeRonda}), você é o beneficiário do *${nomeGrupo}*.\n\nO valor esperado é de *${total}*. Em breve receberá os fundos. 🙏`
  }
}

export function calcularPorcentagem(valor: number, total: number): number {
  if (total === 0) return 0
  return Math.round((valor / total) * 100)
}

export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function corAvatar(nome: string): string {
  const cores = [
    '#22c55e', '#f59e0b', '#3b82f6', '#ec4899',
    '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4',
  ]
  let hash = 0
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  }
  return cores[Math.abs(hash) % cores.length]
}
