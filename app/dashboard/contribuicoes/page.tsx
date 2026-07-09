import { createClient } from '@/lib/supabase/server'
import { formatarMoeda, formatarData, labelMetodo, corAvatar, iniciais, gerarLembreteWhatsapp } from '@/lib/utils'
import Link from 'next/link'

export default async function ContribuicoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch all contributions for user's groups
  const { data: membros } = await supabase
    .from('grupo_membros')
    .select('grupo_id, role')
    .eq('user_id', user.id)

  const grupoIds = membros?.map(m => m.grupo_id) ?? []
  const isAdmin = membros?.some(m => m.role === 'admin') ?? false

  let contribuicoes = []
  if (grupoIds.length > 0) {
    const { data } = await supabase
      .from('contribuicoes')
      .select(`
        *,
        integrante:integrante_id(nome, contacto),
        grupo:grupo_id(nome),
        ronda:ronda_id(nome)
      `)
      .in('grupo_id', grupoIds)
      .order('created_at', { ascending: false })
    contribuicoes = data ?? []
  }

  const estadoBadge = (estado: string) => {
    if (estado === 'confirmado') return 'badge-green'
    if (estado === 'rejeitado') return 'badge-red'
    return 'badge-amber'
  }
  const estadoLabel = (estado: string) =>
    estado === 'confirmado' ? 'Confirmado' :
    estado === 'rejeitado' ? 'Rejeitado' : 'Pendente'

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Contribuições</h1>
            <p className="page-subtitle">Histórico de pagamentos e comprovativos</p>
          </div>
          <Link href="/dashboard/contribuicoes/nova" className="btn btn-primary">
            + Registar Contribuição
          </Link>
        </div>
      </div>

      <div className="card">
        {contribuicoes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon text-sm">⊕</div>
            <div className="empty-state-title">Sem contribuições</div>
            <p className="empty-state-desc">Nenhuma contribuição registada ainda.</p>
          </div>
        ) : (
          <div className="table-container">
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
                {contribuicoes.map((c: any) => (
                  <tr key={c.id}>
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
                          <div style={{ fontWeight: 600 }}>{c.integrante?.nome}</div>
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
                            <form action={async () => {
                              'use server'
                              const { confirmarContribuicao } = await import('@/app/actions/xitique')
                              await confirmarContribuicao(c.id, 'confirmado')
                            }}>
                              <button type="submit" className="btn btn-ghost btn-sm" style={{ color: 'var(--green-400)' }}>
                                ✓
                              </button>
                            </form>
                            <form action={async () => {
                              'use server'
                              const { confirmarContribuicao } = await import('@/app/actions/xitique')
                              await confirmarContribuicao(c.id, 'rejeitado')
                            }}>
                              <button type="submit" className="btn btn-ghost btn-sm" style={{ color: 'var(--red-400)' }}>
                                ✕
                              </button>
                            </form>
                          </div>
                        )}
                        {c.estado === 'confirmado' && (
                          <button 
                            className="btn btn-ghost btn-sm btn-whatsapp"
                            onClick={async () => {
                              'use client'
                              // Using client-side copy logic but this is a server component, 
                              // so we handle it simplistically or could make a client wrapper component.
                              // For MVP, we'll just show it visually.
                            }}
                            title="Lembrete enviado (mock)"
                          >
                            <span style={{ fontSize: 14 }}>✆</span> WhatsApp
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
