// Database types for Xitique Fácil

export type FrequenciaGrupo = 'semanal' | 'quinzenal' | 'mensal'
export type MetodoRotacao = 'fixo' | 'sorteio' | 'manual'
export type EstadoGrupo = 'activo' | 'concluido' | 'suspenso'
export type EstadoIntegrante = 'activo' | 'suspenso' | 'saiu'
export type MetodoRecebimento = 'mpesa' | 'emola' | 'banco' | 'dinheiro'
export type EstadoContribuicao = 'pendente' | 'confirmado' | 'rejeitado'
export type EstadoRonda = 'em_curso' | 'concluida' | 'cancelada'
export type EstadoPagamento = 'pendente' | 'confirmado' | 'cancelado'
export type RoleUtilizador = 'admin' | 'membro'

export interface Grupo {
  id: string
  nome: string
  valor_contribuicao: number
  frequencia: FrequenciaGrupo
  data_inicio: string
  num_membros: number
  metodo_rotacao: MetodoRotacao
  estado: EstadoGrupo
  descricao?: string
  created_at: string
  created_by: string
}

export interface Integrante {
  id: string
  grupo_id: string
  user_id?: string
  nome: string
  contacto: string
  metodo_recebimento: MetodoRecebimento
  conta_destino: string
  nome_conta: string
  estado: EstadoIntegrante
  observacoes?: string
  posicao_ordem?: number
  token_acesso?: string | null
  created_at: string
}

export interface OrdemRecebimento {
  id: string
  grupo_id: string
  integrante_id: string
  posicao: number
  ciclo: number
  estado: 'pendente' | 'recebeu'
  data_recebimento?: string
  integrante?: Integrante
}

export interface Ronda {
  id: string
  grupo_id: string
  nome: string
  data_inicio: string
  data_fim?: string
  beneficiario_id?: string
  estado: EstadoRonda
  ciclo: number
  created_at: string
  beneficiario?: Integrante
  grupo?: Grupo
}

export interface Contribuicao {
  id: string
  grupo_id: string
  ronda_id: string
  integrante_id: string
  valor: number
  data_pagamento: string
  metodo: MetodoRecebimento
  comprovativo_url?: string
  comprovativo_texto?: string
  estado: EstadoContribuicao
  notas?: string
  confirmado_por?: string
  created_at: string
  integrante?: Integrante
  ronda?: Ronda
}

export interface PagamentoBeneficiario {
  id: string
  grupo_id: string
  ronda_id: string
  beneficiario_id: string
  valor_total: number
  data_pagamento: string
  metodo: MetodoRecebimento
  conta_destino?: string
  comprovativo_url?: string
  comprovativo_texto?: string
  estado: EstadoPagamento
  confirmado_por?: string
  created_at: string
  beneficiario?: Integrante
  ronda?: Ronda
}

export interface Auditoria {
  id: string
  usuario_id?: string
  usuario_nome?: string
  accao: string
  tabela?: string
  registo_id?: string
  detalhes?: Record<string, unknown>
  created_at: string
}

export interface GrupoMembro {
  id: string
  grupo_id: string
  user_id: string
  role: RoleUtilizador
  integrante_id?: string
  created_at: string
}

// Dashboard summary types
export interface DashboardResumo {
  grupo: Grupo
  ronda_atual?: Ronda
  beneficiario_atual?: Integrante
  proximo_beneficiario?: Integrante
  total_esperado: number
  total_confirmado: number
  em_falta: number
  membros_ativos: number
  contribuicoes_pendentes: number
  percentagem_confirmado: number
}
