import { createClient } from '@/lib/supabase/server'
import { formatarMoeda, formatarData, labelFrequencia } from '@/lib/utils'
import Link from 'next/link'
import type { Grupo } from '@/lib/types'

export default async function GruposPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membros } = await supabase
    .from('grupo_membros')
    .select('grupo_id, role')
    .eq('user_id', user.id)

  const grupoIds = membros?.map(m => m.grupo_id) ?? []
  const isAdmin = membros?.some(m => m.role === 'admin') ?? false

  let grupos: Grupo[] = []
  if (grupoIds.length > 0) {
    const { data } = await supabase
      .from('grupos')
      .select('*')
      .in('id', grupoIds)
      .order('created_at', { ascending: false })
    grupos = data ?? []
  }

  const estadoBadge = (estado: string) =>
    estado === 'activo' ? 'badge-green' :
    estado === 'concluido' ? 'badge-blue' : 'badge-amber'

  const estadoLabel = (estado: string) =>
    estado === 'activo' ? 'Activo' :
    estado === 'concluido' ? 'Concluído' : 'Suspenso'

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Grupos</h1>
            <p className="page-subtitle">Grupos de Xitique associados à sua conta</p>
          </div>
          <Link href="/dashboard/grupos/novo" className="btn btn-primary">
            + Novo Grupo
          </Link>
        </div>
      </div>

      {grupos.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <div className="empty-state-icon">⬡</div>
          <div className="empty-state-title">Sem grupos</div>
          <p className="empty-state-desc">
            Crie o seu primeiro grupo de Xitique para começar, ou aguarde ser convidado.
          </p>
          <Link href="/dashboard/grupos/novo" className="btn btn-primary">+ Criar Grupo</Link>
        </div>
      ) : (
        <div className="grid-3">
          {grupos.map((g) => (
            <Link href={`/dashboard/grupos/${g.id}`} key={g.id} style={{ textDecoration: 'none' }}>
              <div className="card hover-card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-900)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    ⬡
                  </div>
                  <span className={`badge ${estadoBadge(g.estado)}`}>{estadoLabel(g.estado)}</span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{g.nome}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  {labelFrequencia(g.frequencia)} · {g.num_membros} membros
                </p>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Contribuição</div>
                    <div style={{ fontWeight: 700, color: 'var(--green-400)' }}>{formatarMoeda(g.valor_contribuicao)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Início</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{formatarData(g.data_inicio)}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
