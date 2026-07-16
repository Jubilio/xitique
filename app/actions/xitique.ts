'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── GRUPOS ──────────────────────────────────────────────────
export async function criarGrupo(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const payload = {
    nome: String(formData.get('nome') ?? '').trim(),
    valor_contribuicao: Number(formData.get('valor_contribuicao')),
    frequencia: String(formData.get('frequencia')),
    data_inicio: String(formData.get('data_inicio')),
    num_membros: Number(formData.get('num_membros')),
    metodo_rotacao: String(formData.get('metodo_rotacao')),
    descricao: String(formData.get('descricao') ?? '').trim(),
    estado: 'activo',
    created_by: user.id,
  }

  if (!payload.nome || !payload.valor_contribuicao || !payload.frequencia || !payload.data_inicio) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  const { data: novoGrupo, error } = await supabase.from('grupos').insert(payload).select('id').single()
  if (error) return { error: error.message }

  // Add the creator as the admin of the group
  const { error: errorMembro } = await supabase.from('grupo_membros').insert({
    grupo_id: novoGrupo.id,
    user_id: user.id,
    role: 'admin'
  })
  if (errorMembro) return { error: errorMembro.message }

  await registarAuditoria(supabase, user, 'criar_grupo', 'grupos', novoGrupo.id, { nome: payload.nome })
  revalidatePath('/dashboard/grupos')
  return { success: true }
}

export async function atualizarGrupo(
  grupoId: string,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const payload = {
    nome: String(formData.get('nome') ?? '').trim(),
    valor_contribuicao: Number(formData.get('valor_contribuicao')),
    frequencia: String(formData.get('frequencia')),
    data_inicio: String(formData.get('data_inicio')),
    num_membros: Number(formData.get('num_membros')),
    metodo_rotacao: String(formData.get('metodo_rotacao')),
    descricao: String(formData.get('descricao') ?? '').trim(),
  }

  const { error } = await supabase
    .from('grupos')
    .update(payload)
    .eq('id', grupoId)

  if (error) return { error: error.message }

  await registarAuditoria(supabase, user, 'atualizar_grupo', 'grupos', grupoId, payload)
  revalidatePath('/dashboard/grupos')
  revalidatePath(`/dashboard/grupos/${grupoId}`)
  return { success: true }
}

// ─── INTEGRANTES ─────────────────────────────────────────────
export async function criarIntegrante(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const nome = String(formData.get('nome') ?? '').trim()
  if (!nome) return { error: 'O nome do membro é obrigatório.' }

  const payload = {
    grupo_id: String(formData.get('grupo_id') || '') || null,
    nome,
    contacto: String(formData.get('contacto') ?? '').trim() || null,
    metodo_recebimento: String(formData.get('metodo_recebimento') || '') || null,
    conta_destino: String(formData.get('conta_destino') ?? '').trim() || null,
    nome_conta: String(formData.get('nome_conta') ?? '').trim() || null,
    estado: 'activo',
    observacoes: String(formData.get('observacoes') ?? '').trim() || null,
    posicao_ordem: Number(formData.get('posicao_ordem') ?? 0) || null,
  }

  const { error } = await supabase.from('integrantes').insert(payload)
  if (error) return { error: error.message }

  await registarAuditoria(supabase, user, 'criar_integrante', 'integrantes', null, { nome: payload.nome })
  revalidatePath('/dashboard/integrantes')
  if (payload.grupo_id) revalidatePath(`/dashboard/grupos/${payload.grupo_id}`)
  return { success: true }
}

export async function atualizarEstadoIntegrante(
  integranteId: string,
  estado: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase
    .from('integrantes')
    .update({ estado })
    .eq('id', integranteId)

  if (error) return { error: error.message }

  await registarAuditoria(supabase, user, 'atualizar_estado_integrante', 'integrantes', integranteId, { estado })
  revalidatePath('/dashboard/integrantes')
  return {}
}

// ─── CONTRIBUIÇÕES ───────────────────────────────────────────
export async function registarContribuicao(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const payload = {
    grupo_id: String(formData.get('grupo_id')),
    ronda_id: String(formData.get('ronda_id')),
    integrante_id: String(formData.get('integrante_id')),
    valor: Number(formData.get('valor')),
    data_pagamento: String(formData.get('data_pagamento')),
    metodo: String(formData.get('metodo')),
    comprovativo_texto: String(formData.get('comprovativo_texto') ?? '').trim(),
    notas: String(formData.get('notas') ?? '').trim(),
    estado: 'pendente',
  }

  if (!payload.integrante_id || !payload.valor || !payload.data_pagamento) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  const { error } = await supabase.from('contribuicoes').insert(payload)
  if (error) return { error: error.message }

  await registarAuditoria(supabase, user, 'registar_contribuicao', 'contribuicoes', null, payload)
  revalidatePath('/dashboard/contribuicoes')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function confirmarContribuicao(
  contribuicaoId: string,
  estado: 'confirmado' | 'rejeitado'
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase
    .from('contribuicoes')
    .update({ estado, confirmado_por: user.email })
    .eq('id', contribuicaoId)

  if (error) return { error: error.message }

  await registarAuditoria(supabase, user, `${estado}_contribuicao`, 'contribuicoes', contribuicaoId, { estado })
  revalidatePath('/dashboard/contribuicoes')
  revalidatePath('/dashboard')
  return {}
}

// ─── RONDAS ──────────────────────────────────────────────────
export async function criarRonda(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const payload = {
    grupo_id: String(formData.get('grupo_id')),
    nome: String(formData.get('nome') ?? '').trim(),
    data_inicio: String(formData.get('data_inicio')),
    beneficiario_id: String(formData.get('beneficiario_id')) || null,
    estado: 'em_curso',
    ciclo: Number(formData.get('ciclo') ?? 1),
  }

  const { error } = await supabase.from('rondas').insert(payload)
  if (error) return { error: error.message }

  await registarAuditoria(supabase, user, 'criar_ronda', 'rondas', null, payload)
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/grupos/${payload.grupo_id}`)
  return { success: true }
}

// ─── PAGAMENTOS AO BENEFICIÁRIO ──────────────────────────────
export async function registarPagamentoBeneficiario(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const payload = {
    grupo_id: String(formData.get('grupo_id')),
    ronda_id: String(formData.get('ronda_id')),
    beneficiario_id: String(formData.get('beneficiario_id')),
    valor_total: Number(formData.get('valor_total')),
    data_pagamento: String(formData.get('data_pagamento')),
    metodo: String(formData.get('metodo')),
    conta_destino: String(formData.get('conta_destino') ?? '').trim(),
    comprovativo_texto: String(formData.get('comprovativo_texto') ?? '').trim(),
    estado: 'confirmado',
    confirmado_por: user.email,
  }

  if (!payload.beneficiario_id || !payload.valor_total) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  const { error } = await supabase.from('pagamentos_beneficiario').insert(payload)
  if (error) return { error: error.message }

  // Mark ronda beneficiario as received
  await supabase
    .from('ordem_recebimento')
    .update({ estado: 'recebeu', data_recebimento: payload.data_pagamento })
    .eq('grupo_id', payload.grupo_id)
    .eq('integrante_id', payload.beneficiario_id)

  await registarAuditoria(supabase, user, 'pagamento_beneficiario', 'pagamentos_beneficiario', null, payload)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/pagamentos')
  return { success: true }
}

export async function concluirRonda(
  rondaId: string,
  grupoId: string,
  beneficiarioId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // 1. Atualiza a ronda para concluída
  const { error: rondaError } = await supabase
    .from('rondas')
    .update({ estado: 'concluida', data_fim: new Date().toISOString().split('T')[0] })
    .eq('id', rondaId)

  if (rondaError) return { error: rondaError.message }

  // 2. Atualiza a ordem de recebimento do beneficiário
  if (beneficiarioId) {
    const { error: ordemError } = await supabase
      .from('ordem_recebimento')
      .update({ estado: 'recebeu', data_recebimento: new Date().toISOString() })
      .eq('grupo_id', grupoId)
      .eq('integrante_id', beneficiarioId)

    if (ordemError) return { error: ordemError.message }
  }

  await registarAuditoria(supabase, user, 'concluir_ronda', 'rondas', rondaId, { grupoId, beneficiarioId })
  revalidatePath(`/dashboard/grupos/${grupoId}`)
  return { success: true }
}


// ─── AUDITORIA HELPER ────────────────────────────────────────
async function registarAuditoria(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any,
  accao: string,
  tabela: string,
  registoId: string | null,
  detalhes: Record<string, unknown>
) {
  await supabase.from('auditoria').insert({
    usuario_id: user.id,
    usuario_nome: user.email,
    accao,
    tabela,
    registo_id: registoId,
    detalhes,
  })
}
