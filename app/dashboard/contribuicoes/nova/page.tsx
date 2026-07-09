'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { registarContribuicao } from '@/app/actions/xitique'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Grupo, Integrante, Ronda } from '@/lib/types'

export default function NovaContribuicaoPage() {
  const [state, action, pending] = useActionState(registarContribuicao, undefined)
  const router = useRouter()

  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [integrantes, setIntegrantes] = useState<Integrante[]>([])
  const [rondas, setRondas] = useState<Ronda[]>([])
  const [grupoId, setGrupoId] = useState('')
  const [valorPadrao, setValorPadrao] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load user's groups on mount
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membros } = await supabase
        .from('grupo_membros')
        .select('grupo_id')
        .eq('user_id', user.id)

      const ids = membros?.map(m => m.grupo_id) ?? []
      if (ids.length > 0) {
        const { data: g } = await supabase
          .from('grupos')
          .select('*')
          .in('id', ids)
          .eq('estado', 'activo')
        setGrupos(g ?? [])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // When grupo changes, load integrantes + rondas
  useEffect(() => {
    if (!grupoId) {
      setIntegrantes([])
      setRondas([])
      return
    }

    async function fetchGrupoData() {
      const supabase = createClient()
      const [intRes, rondaRes] = await Promise.all([
        supabase.from('integrantes').select('*').eq('grupo_id', grupoId).eq('estado', 'activo').order('nome'),
        supabase.from('rondas').select('*').eq('grupo_id', grupoId).eq('estado', 'em_curso').order('created_at', { ascending: false }),
      ])
      setIntegrantes(intRes.data ?? [])
      setRondas(rondaRes.data ?? [])

      const grupo = grupos.find(g => g.id === grupoId)
      if (grupo) setValorPadrao(grupo.valor_contribuicao)
    }
    fetchGrupoData()
  }, [grupoId, grupos])

  useEffect(() => {
    if (state?.success) {
      router.push('/dashboard/contribuicoes')
    }
  }, [state, router])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div className="loading-spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Registar Contribuição</h1>
            <p className="page-subtitle">Registar pagamento de um membro</p>
          </div>
          <Link href="/dashboard/contribuicoes" className="btn btn-secondary">← Voltar</Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <form action={action}>
          {state?.error && (
            <div className="alert alert-red mb-4">
              <span>⚠️</span>
              <span>{state.error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Grupo */}
            <div className="form-group">
              <label htmlFor="grupo_id" className="form-label">Grupo <span>*</span></label>
              <select
                id="grupo_id"
                name="grupo_id"
                className="form-input"
                required
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)}
              >
                <option value="">Seleccionar grupo…</option>
                {grupos.map(g => (
                  <option key={g.id} value={g.id}>{g.nome}</option>
                ))}
              </select>
            </div>

            {/* Ronda */}
            <div className="form-group">
              <label htmlFor="ronda_id" className="form-label">Ronda <span>*</span></label>
              <select id="ronda_id" name="ronda_id" className="form-input" required>
                <option value="">Seleccionar ronda…</option>
                {rondas.map(r => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
              {grupoId && rondas.length === 0 && (
                <span className="form-error">Não há ronda activa. Crie uma ronda na página do grupo.</span>
              )}
            </div>

            {/* Integrante */}
            <div className="form-group">
              <label htmlFor="integrante_id" className="form-label">Integrante <span>*</span></label>
              <select id="integrante_id" name="integrante_id" className="form-input" required>
                <option value="">Seleccionar membro…</option>
                {integrantes.map(i => (
                  <option key={i.id} value={i.id}>{i.nome} — {i.contacto}</option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="valor" className="form-label">Valor (MT) <span>*</span></label>
                <input
                  id="valor"
                  name="valor"
                  type="number"
                  min={1}
                  className="form-input"
                  defaultValue={valorPadrao || ''}
                  placeholder="2000"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="data_pagamento" className="form-label">Data do pagamento <span>*</span></label>
                <input
                  id="data_pagamento"
                  name="data_pagamento"
                  type="date"
                  className="form-input"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="metodo" className="form-label">Método de pagamento <span>*</span></label>
              <select id="metodo" name="metodo" className="form-input" required>
                <option value="">Seleccionar…</option>
                <option value="mpesa">M-Pesa</option>
                <option value="emola">e-Mola</option>
                <option value="banco">Banco</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>

            {/* Comprovativo (texto) */}
            <div className="form-group">
              <label htmlFor="comprovativo_texto" className="form-label">Comprovativo (texto)</label>
              <textarea
                id="comprovativo_texto"
                name="comprovativo_texto"
                className="form-input"
                rows={3}
                placeholder="Cole aqui a mensagem M-Pesa/e-Mola, ex:&#10;Confirmado. Recebeste 2.000MT de Ana Mausse pelo M-Pesa em 08/07/2026."
              />
              <span className="form-hint">Cole a mensagem de confirmação do M-Pesa, e-Mola ou banco.</span>
            </div>

            {/* Notas */}
            <div className="form-group">
              <label htmlFor="notas" className="form-label">Notas</label>
              <textarea id="notas" name="notas" className="form-input" placeholder="Notas adicionais (opcional)" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
            <Link href="/dashboard/contribuicoes" className="btn btn-secondary">Cancelar</Link>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? (
                <><span className="loading-spinner" style={{ width: 16, height: 16 }} /> A registar…</>
              ) : 'Registar Contribuição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
