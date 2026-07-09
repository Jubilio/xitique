import { createClient } from '@/lib/supabase/server'
import { formatarMoeda, formatarData, labelMetodo, corAvatar, iniciais } from '@/lib/utils'

export default async function PagamentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Apenas admin tem acesso a esta página (protegido no middleware/layout num cenário real, aqui verificamos por segurança)
  const { data: membros } = await supabase
    .from('grupo_membros')
    .select('grupo_id, role')
    .eq('user_id', user.id)
    .eq('role', 'admin')

  const grupoIds = membros?.map(m => m.grupo_id) ?? []
  
  if (grupoIds.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🚫</div>
        <div className="empty-state-title">Acesso Negado</div>
        <p className="empty-state-desc">Apenas administradores podem gerir pagamentos aos beneficiários.</p>
      </div>
    )
  }

  const { data: pagamentos } = await supabase
    .from('pagamentos_beneficiario')
    .select(`
      *,
      beneficiario:beneficiario_id(nome, contacto),
      grupo:grupo_id(nome),
      ronda:ronda_id(nome)
    `)
    .in('grupo_id', grupoIds)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Pagamentos Entregues</h1>
            <p className="page-subtitle">Registo de valores entregues aos beneficiários</p>
          </div>
        </div>
      </div>

      <div className="card">
        {!pagamentos || pagamentos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon text-sm">◎</div>
            <div className="empty-state-title">Sem pagamentos</div>
            <p className="empty-state-desc">Ainda não foi registada nenhuma entrega de Xitique.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Beneficiário</th>
                  <th>Grupo / Ronda</th>
                  <th>Valor Total</th>
                  <th>Data & Método</th>
                  <th>Confirmado Por</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          className="avatar avatar-sm"
                          style={{
                            background: corAvatar(p.beneficiario?.nome ?? '') + '33',
                            color: corAvatar(p.beneficiario?.nome ?? ''),
                          }}
                        >
                          {iniciais(p.beneficiario?.nome ?? '?')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.beneficiario?.nome}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.beneficiario?.contacto}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.grupo?.nome}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.ronda?.nome}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--green-400)' }}>{formatarMoeda(p.valor_total)}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{formatarData(p.data_pagamento)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{labelMetodo(p.metodo)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>{p.confirmado_por}</div>
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
