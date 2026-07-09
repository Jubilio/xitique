'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatarMoeda, formatarData } from '@/lib/utils'
import Link from 'next/link'

interface Contribuicao {
  id: string
  valor: number
  data_pagamento: string
  estado: string
  confirmado_por: string | null
  grupo_id: string
  created_at: string
  integrante?: { nome: string }
  grupo?: { nome: string }
}

interface Props {
  contribuicoesIniciais: Contribuicao[]
  grupoIds: string[]
}

export default function RealtimePendentes({ contribuicoesIniciais, grupoIds }: Props) {
  const [pendentes, setPendentes] = useState<Contribuicao[]>(contribuicoesIniciais)
  const [novos, setNovos] = useState<Set<string>>(new Set())
  const [isLive, setIsLive] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!grupoIds.length) return

    const supabase = createClient()
    setIsLive(true)

    const channel = supabase
      .channel('contribuicoes-realtime')
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
            // Fetch the full record with joins
            const { data } = await supabase
              .from('contribuicoes')
              .select('*, integrante:integrante_id(nome), grupo:grupo_id(nome)')
              .eq('id', payload.new.id)
              .single()
            
            if (data && data.estado === 'pendente') {
              setPendentes(prev => [data as Contribuicao, ...prev])
              setNovos(prev => new Set([...prev, data.id]))
              
              // Clear the "new" highlight after 5s
              setTimeout(() => {
                setNovos(prev => {
                  const next = new Set(prev)
                  next.delete(data.id)
                  return next
                })
              }, 5000)
            }
          } else if (payload.eventType === 'UPDATE') {
            // Remove from pendentes if no longer pending
            if (payload.new.estado !== 'pendente') {
              setPendentes(prev => prev.filter(c => c.id !== payload.new.id))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      setIsLive(false)
    }
  }, [grupoIds])

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">A aguardar confirmação</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLive && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--green-400)' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--green-500)',
                display: 'inline-block',
                animation: 'pulse 2s infinite'
              }} />
              Ao Vivo
            </span>
          )}
          <Link href="/dashboard/contribuicoes" className="btn btn-ghost btn-sm">Ver todas →</Link>
        </div>
      </div>

      {pendentes && pendentes.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pendentes.slice(0, 6).map((c: Contribuicao) => (
            <div key={c.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              borderRadius: 10,
              background: novos.has(c.id) ? 'rgba(34,197,94,0.08)' : 'var(--bg-input)',
              border: `1px solid ${novos.has(c.id) ? 'var(--green-500)' : 'var(--border)'}`,
              transition: 'background 0.5s, border-color 0.5s',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.integrante?.nome ?? '—'}</div>
                  {novos.has(c.id) && (
                    <span className="badge badge-green" style={{ fontSize: 10 }}>🔔 Novo!</span>
                  )}
                  {c.confirmado_por === 'Sistema IA' && (
                    <span className="badge badge-green" style={{ fontSize: 10 }}>🤖 IA</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {c.grupo?.nome} · {formatarData(c.data_pagamento)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--amber-400)' }}>{formatarMoeda(c.valor)}</div>
                <span className="badge badge-amber" style={{ fontSize: 10 }}>Pendente</span>
              </div>
            </div>
          ))}
          {pendentes.length > 6 && (
            <Link href="/dashboard/contribuicoes" className="btn btn-ghost btn-sm" style={{ textAlign: 'center' }}>
              +{pendentes.length - 6} mais →
            </Link>
          )}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <div className="empty-state-title" style={{ fontSize: 14, color: 'var(--green-400)' }}>Tudo confirmado!</div>
        </div>
      )}
    </div>
  )
}
