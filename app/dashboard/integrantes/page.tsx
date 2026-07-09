import { createClient } from '@/lib/supabase/server'
import { labelMetodo, corAvatar, iniciais } from '@/lib/utils'
import Link from 'next/link'
import CopiarConviteBtn from '@/components/CopiarConviteBtn'
import type { Integrante } from '@/lib/types'

export default async function IntegrantesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membros } = await supabase
    .from('grupo_membros')
    .select('grupo_id, role')
    .eq('user_id', user.id)

  const grupoIds = membros?.map(m => m.grupo_id) ?? []
  const isAdmin = membros?.some(m => m.role === 'admin') ?? false

  let integrantes: (Integrante & { grupo?: { nome: string, valor_contribuicao: number } })[] = []
  if (grupoIds.length > 0) {
    const { data } = await supabase
      .from('integrantes')
      .select('*, grupo:grupo_id(nome, valor_contribuicao)')
      .in('grupo_id', grupoIds)
      .order('created_at', { ascending: false })
    integrantes = (data as typeof integrantes) ?? []
  }

  const estadoBadge = (estado: string) =>
    estado === 'activo' ? 'badge-green' :
    estado === 'suspenso' ? 'badge-amber' : 'badge-red'

  const estadoLabel = (estado: string) =>
    estado === 'activo' ? 'Activo' :
    estado === 'suspenso' ? 'Suspenso' : 'Saiu'

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Integrantes</h1>
            <p className="page-subtitle">Membros dos seus grupos de Xitique</p>
          </div>
          {isAdmin && (
            <Link href="/dashboard/integrantes/novo" className="btn btn-primary">
              + Adicionar Membro
            </Link>
          )}
        </div>
      </div>

      {integrantes.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <div className="empty-state-icon">◉</div>
          <div className="empty-state-title">Sem integrantes</div>
          <p className="empty-state-desc">
            {isAdmin
              ? 'Adicione membros ao seu grupo para começar.'
              : 'Nenhum membro registado nos seus grupos.'}
          </p>
          {isAdmin && (
            <Link href="/dashboard/integrantes/novo" className="btn btn-primary">+ Adicionar Membro</Link>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Contacto</th>
                  <th>Grupo</th>
                  <th>Método</th>
                  <th>Ordem</th>
                  <th>Link Mágico (Acesso s/ Login)</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {integrantes.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          className="avatar avatar-sm"
                          style={{
                            background: corAvatar(i.nome) + '33',
                            color: corAvatar(i.nome),
                          }}
                        >
                          {iniciais(i.nome)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{i.nome}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{i.nome_conta || 'Conta não definida'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{i.contacto}</td>
                    <td>
                      <span className="badge badge-blue">{i.grupo?.nome ?? '—'}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{labelMetodo(i.metodo_recebimento)}</td>
                    <td>{i.posicao_ordem ? `${i.posicao_ordem}º a receber` : 'Não definida'}</td>
                    <td>
                      {i.token_acesso ? (
                        <CopiarConviteBtn 
                          token={i.token_acesso} 
                          nomeIntegrante={i.nome}
                          contacto={i.contacto ?? ''}
                          nomeGrupo={i.grupo?.nome ?? ''}
                          valorContribuicao={i.grupo?.valor_contribuicao ?? 0}
                        />
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sem token</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-dot ${estadoBadge(i.estado)}`}>
                        {estadoLabel(i.estado)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
