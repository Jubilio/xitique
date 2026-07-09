import { createClient } from '@/lib/supabase/server'
import { formatarDataHora } from '@/lib/utils'

export default async function AuditoriaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Only admins see audit trail — check role
  const { data: membros } = await supabase
    .from('grupo_membros')
    .select('grupo_id, role')
    .eq('user_id', user.id)
    .eq('role', 'admin')

  if (!membros || membros.length === 0) {
    return (
      <div className="empty-state card" style={{ padding: 60, marginTop: 40 }}>
        <div className="empty-state-icon">🚫</div>
        <div className="empty-state-title">Acesso Negado</div>
        <p className="empty-state-desc">Apenas administradores podem ver o registo de auditoria.</p>
      </div>
    )
  }

  const { data: logs } = await supabase
    .from('auditoria')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const accaoLabel = (accao: string) => {
    const labels: Record<string, string> = {
      criar_grupo: '🆕 Grupo criado',
      atualizar_grupo: '✏️ Grupo actualizado',
      criar_integrante: '👤 Membro adicionado',
      atualizar_estado_integrante: '🔄 Estado do membro alterado',
      registar_contribuicao: '💰 Contribuição registada',
      confirmado_contribuicao: '✅ Contribuição confirmada',
      rejeitado_contribuicao: '❌ Contribuição rejeitada',
      criar_ronda: '🔁 Nova ronda criada',
      pagamento_beneficiario: '🎉 Pagamento ao beneficiário',
    }
    return labels[accao] ?? accao
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Auditoria</h1>
        <p className="page-subtitle">Registo completo de todas as acções no sistema</p>
      </div>

      <div className="card">
        {!logs || logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon text-sm">≡</div>
            <div className="empty-state-title">Sem registos</div>
            <p className="empty-state-desc">Ainda não há actividade registada.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Acção</th>
                  <th>Utilizador</th>
                  <th>Tabela</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {formatarDataHora(log.created_at)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{accaoLabel(log.accao)}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {log.usuario_nome ?? '—'}
                    </td>
                    <td>
                      <span className="badge badge-gray">{log.tabela ?? '—'}</span>
                    </td>
                    <td style={{ maxWidth: 300 }}>
                      {log.detalhes ? (
                        <details>
                          <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
                            Ver detalhes
                          </summary>
                          <pre style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            marginTop: 6,
                            padding: 8,
                            background: 'var(--bg-input)',
                            borderRadius: 6,
                            overflow: 'auto',
                            maxHeight: 120,
                          }}>
                            {JSON.stringify(log.detalhes, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
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
