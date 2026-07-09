'use server'

import { createClient } from '@/lib/supabase/client' // Use normal client, we call RPC
import { revalidatePath } from 'next/cache'

export async function atualizarMembroPorToken(
  prevState: { success?: boolean; error?: string } | undefined,
  formData: FormData
) {
  const supabase = createClient() // We can use client since RPC handles security
  const token = String(formData.get('token') ?? '')
  const metodo_recebimento = String(formData.get('metodo_recebimento') ?? '')
  const conta_destino = String(formData.get('conta_destino') ?? '')
  const nome_conta = String(formData.get('nome_conta') ?? '')
  const posicaoRaw = formData.get('posicao')
  
  let posicao = null
  if (posicaoRaw && String(posicaoRaw).trim() !== '') {
    posicao = parseInt(String(posicaoRaw), 10)
  }

  if (!token) return { error: 'Link inválido.' }

  const { data, error } = await supabase.rpc('update_membro_por_token', {
    p_token: token,
    p_metodo_recebimento: metodo_recebimento,
    p_conta_destino: conta_destino,
    p_nome_conta: nome_conta,
    p_posicao: posicao
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/convite/${token}`)
  return { success: true }
}

export async function submeterPagamentoMembro(
  token: string,
  rondaId: string,
  valor: number,
  metodo: string,
  comprovativoUrl: string,
  transacaoId: string,
  validadoIa: boolean
) {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('registar_contribuicao_por_token', {
    p_token: token,
    p_ronda_id: rondaId,
    p_valor: valor,
    p_metodo: metodo,
    p_comprovativo_url: comprovativoUrl,
    p_transacao_id: transacaoId,
    p_notas: null,
    p_validado_ia: validadoIa
  })

  if (error) {
    console.error('Error submitting payment:', error)
    return { error: error.message }
  }

  revalidatePath(`/convite/${token}`)
  return { success: true }
}
