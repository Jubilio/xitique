import { createClient } from '@/lib/supabase/server'
import { formatarMoeda, formatarData, labelFrequencia, iniciais, corAvatar } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Grupo, Integrante, OrdemRecebimento, Ronda } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GrupoDetailsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch grupo
  const { data: grupo, error } = await supabase
    .from('grupos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !grupo) notFound()

  // Verify access (admin check omitted for brevity, assumes layout protects it)

  // Fetch integrantes and ordem
  const { data: integrantes } = await supabase
    .from('integrantes')
    .select('*')
    .eq('grupo_id', id)
    .order('created_at', { ascending: true })

  const { data: ordem } = await supabase
    .from('ordem_recebimento')
    .select('*, integrante:integrante_id(nome, contacto)')
    .eq('grupo_id', id)
    .order('posicao', { ascending: true })

  // Fetch rondas
  const { data: rondas } = await supabase
    .from('rondas')
    .select('*, beneficiario:beneficiario_id(nome)')
    .eq('grupo_id', id)
    .order('data_inicio', { ascending: false })

  const activeRonda = rondas?.find(r => r.estado === 'em_curso')

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <Link href="/dashboard/grupos" className="btn btn-ghost btn-sm" style={{ marginBottom: 12, padding: 0 }}>
              ← Voltar aos grupos
            </Link>
            <h1 className="page-title">{grupo.nome}</h1>
            <p className="page-subtitle">
              {labelFrequencia(grupo.frequencia)} · {formatarMoeda(grupo.valor_contribuicao)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href={`/dashboard/integrantes/novo?grupo_id=${grupo.id}`} className="btn btn-secondary">
              + Adicionar Membro
            </Link>
            {!activeRonda && (
              <form action={async () => {
                'use server'
                // simplified create ronda action for demo
                const { createClient } = await import('@/lib/supabase/server')
                const s = await createClient()
                await s.from('rondas').insert({
                  grupo_id: id,
                  nome: `Ronda ${rondas ? rondas.length + 1 : 1}`,
                  data_inicio: new Date().toISOString().split('T')[0],
                  estado: 'em_curso',
                  ciclo: 1
                })
                const { revalidatePath } = await import('next/cache')
                revalidatePath(`/dashboard/grupos/${id}`)
              }}>
                <button type="submit" className="btn btn-primary">
                  Iniciar Nova Ronda
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card mb-6">
            <h3 className="card-title">Detalhes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginTop: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Status</div>
                <div style={{ fontWeight: 600 }}>{grupo.estado}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Membros Activos</div>
                <div style={{ fontWeight: 600 }}>{integrantes?.filter(i => i.estado === 'activo').length ?? 0} / {grupo.num_membros}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total por Ronda</div>
                <div style={{ fontWeight: 600, color: 'var(--green-400)' }}>{formatarMoeda(grupo.valor_contribuicao * grupo.num_membros)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Data Início</div>
                <div style={{ fontWeight: 600 }}>{formatarData(grupo.data_inicio)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Rondas ({rondas?.length ?? 0})</h3>
            {rondas && rondas.length > 0 ? (
              <div className="timeline mt-4">
                {rondas.map(r => (
                  <div key={r.id} className="timeline-item">
                    <div className={`timeline-dot ${r.estado === 'em_curso' ? 'atual' : 'recebeu'}`}>
                      {r.estado === 'em_curso' ? '●' : '✓'}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-name">{r.nome}</div>
                      <div className="timeline-meta">
                        {formatarData(r.data_inicio)} · Beneficiário: {(r as any).beneficiario?.nome ?? 'Não definido'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm mt-4">Nenhuma ronda iniciada.</p>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Ordem de Recebimento</span>
            </div>
            
            {ordem && ordem.length > 0 ? (
              <div className="timeline mt-2">
                {ordem.map((o: any, idx) => {
                  const isCurrent = activeRonda && activeRonda.beneficiario_id === o.integrante_id
                  const statusClass = o.estado === 'recebeu' ? 'recebeu' : (isCurrent ? 'atual' : 'proximo')
                  
                  return (
                    <div key={o.id} className="timeline-item">
                      <div className={`timeline-dot ${statusClass}`}>
                        {o.posicao}
                      </div>
                      <div className="timeline-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                          <div className="timeline-name">{o.integrante?.nome}</div>
                          <div className="timeline-meta">
                            {o.estado === 'recebeu' 
                              ? `Recebeu em ${o.data_recebimento ? formatarData(o.data_recebimento) : '-'}` 
                              : isCurrent ? 'A receber nesta ronda' : 'Aguardando'}
                          </div>
                        </div>
                        
                        {isCurrent && activeRonda && (
                          <form action={async () => {
                            'use server'
                            const { concluirRonda } = await import('@/app/actions/xitique')
                            await concluirRonda(activeRonda.id, id, o.integrante_id)
                          }}>
                            <button 
                              type="submit" 
                              className="btn btn-primary" 
                              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 20 }}
                              title="Confirmar que o membro recebeu o valor total e concluir esta ronda"
                            >
                              ✓ Marcar como Pago
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon text-sm">≡</div>
                <div className="empty-state-title">Ordem não definida</div>
                <p className="empty-state-desc">Configure a ordem de recebimento para os membros.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
