'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatarMoeda, formatarData, labelMetodo, corAvatar, iniciais } from '@/lib/utils'
import { confirmarContribuicao } from '@/app/actions/xitique'

interface Contribuicao {
  id: string
  valor: number
  data_pagamento: string
  estado: string
  metodo: any
  confirmado_por: string | null
  grupo_id: string
  integrante_id: string
  ronda_id: string
  created_at: string
  integrante?: { nome: string, contacto?: string }
  grupo?: { nome: string }
  ronda?: { nome: string }
}

interface Props {
  contribuicoesIniciais: Contribuicao[]
  grupoIds: string[]
  isAdmin: boolean
}

export default function RealtimeContribuicoesTable({ contribuicoesIniciais, grupoIds, isAdmin }: Props) {
  const [contribuicoes, setContribuicoes] = useState<Contribuicao[]>(contribuicoesIniciais)
  const [novos, setNovos] = useState<Set<string>>(new Set())
  const [processando, setProcessando] = useState<Set<string>>(new Set())
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (!grupoIds.length) return

    const supabase = createClient()
    setIsLive(true)

    const channel = supabase
      .channel('contribuicoes-todas-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contribuicoes',
          filter: `grupo_id=in.(${grupoIds.join(',')})`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('contribuicoes')
              .select('*, integrante:integrante_id(nome, contacto), grupo:grupo_id(nome), ronda:ronda_id(nome)')
              .eq('id', payload.new.id)
              .single()
            
            if (data) {
              setContribuicoes(prev => [data as Contribuicao, ...prev])
              setNovos(prev => new Set([...prev, data.id]))
              
              setTimeout(() => {
                setNovos(prev => {
                  const next = new Set(prev)
                  next.delete(data.id)
                  return next
                })
              }, 5000)
            }
          } else if (payload.eventType === 'UPDATE') {
            setContribuicoes(prev => prev.map(c => 
              c.id === payload.new.id ? { ...c, estado: payload.new.estado } : c
            ))
          } else if (payload.eventType === 'DELETE') {
            setContribuicoes(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      setIsLive(false)
    }
  }, [grupoIds])

  const handleAction = async (id: string, novoEstado: 'confirmado' | 'rejeitado') => {
    // Optimistic Update
    setProcessando(prev => new Set([...prev, id]))
    const prevEstado = contribuicoes.find(c => c.id === id)?.estado

    setContribuicoes(prev => prev.map(c => 
      c.id === id ? { ...c, estado: novoEstado } : c
    ))

    try {
      await confirmarContribuicao(id, novoEstado)
    } catch (error) {
      // Revert on failure
      console.error('Falha ao actualizar contribuição:', error)
      if (prevEstado) {
        setContribuicoes(prev => prev.map(c => 
          c.id === id ? { ...c, estado: prevEstado } : c
        ))
      }
    } finally {
      setProcessando(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const estadoBadge = (estado: string) => {
    if (estado === 'confirmado') return 'badge-green'
    if (estado === 'rejeitado') return 'badge-red'
    return 'badge-amber'
  }
  
  const estadoLabel = (estado: string) =>
    estado === 'confirmado' ? 'Confirmado' :
    estado === 'rejeitado' ? 'Rejeitado' : 'Pendente'

  if (contribuicoes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon text-sm">⊕</div>
        <div className="empty-state-title">Sem contribuições</div>
        <p className="empty-state-desc">Nenhuma contribuição registada ainda.</p>
      </div>
    )
  }

  return (
    <div className="table-container">
      {isLive && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green-400)' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--green-500)',
            display: 'inline-block',
            animation: 'pulse 2s infinite'
          }} />
          Actualização ao vivo activada
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>Integrante</th>
            <th>Grupo / Ronda</th>
            <th>Valor</th>
            <th>Data & Método</th>
            <th>Estado</th>
            {isAdmin && <th style={{ textAlign: 'right' }}>Acções</th>}
          </tr>
        </thead>
        <tbody>
          {contribuicoes.map((c) => {
            const isNovo = novos.has(c.id)
            const isProcessando = processando.has(c.id)
            
            return (
              <tr 
                key={c.id} 
                style={{ 
                  background: isNovo ? 'rgba(34,197,94,0.08)' : 'transparent',
                  transition: 'background 1s ease',
                  opacity: isProcessando ? 0.6 : 1,
                  pointerEvents: isProcessando ? 'none' : 'auto'
                }}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      className="avatar avatar-sm"
                      style={{
                        background: corAvatar(c.integrante?.nome ?? '') + '33',
                        color: corAvatar(c.integrante?.nome ?? ''),
                      }}
                    >
                      {iniciais(c.integrante?.nome ?? '?')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {c.integrante?.nome}
                        {isNovo && <span className="badge badge-green" style={{ fontSize: 9, padding: '2px 4px' }}>Novo</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.integrante?.contacto}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{c.grupo?.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.ronda?.nome}</div>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--green-400)' }}>{formatarMoeda(c.valor)}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{formatarData(c.data_pagamento)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{labelMetodo(c.metodo)}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                    <span className={`badge badge-dot ${estadoBadge(c.estado)}`}>
                      {estadoLabel(c.estado)}
                    </span>
                    {c.confirmado_por === 'Sistema IA' && (
                      <span className="badge badge-green" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                        🤖 Auto-Validado
                      </span>
                    )}
                  </div>
                </td>
                {isAdmin && (
                  <td style={{ textAlign: 'right' }}>
                    {c.estado === 'pendente' && (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleAction(c.id, 'confirmado')}
                          className="btn btn-ghost btn-sm" 
                          style={{ color: 'var(--green-400)' }}
                          disabled={isProcessando}
                        >
                          ✓
                        </button>
                        <button 
                          onClick={() => handleAction(c.id, 'rejeitado')}
                          className="btn btn-ghost btn-sm" 
                          style={{ color: 'var(--red-400)' }}
                          disabled={isProcessando}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {c.estado === 'confirmado' && (
                      <button 
                        className="btn btn-ghost btn-sm btn-whatsapp"
                        onClick={() => alert('WhatsApp integrado na próxima versão')}
                        title="Enviar lembrete"
                      >
                        <span style={{ fontSize: 14 }}>✆</span>
                      </button>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
