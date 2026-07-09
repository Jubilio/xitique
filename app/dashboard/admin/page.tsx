import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatarMoeda, formatarData } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify this user is an admin of at least one group
  const { data: membros } = await supabase
    .from('grupo_membros')
    .select('role, grupo_id')
    .eq('user_id', user.id)

  const isAdmin = membros?.some(m => m.role === 'admin') ?? false
  if (!isAdmin) redirect('/dashboard')

  const grupoIds = membros?.map(m => m.grupo_id) ?? []

  // Fetch all groups this admin manages
  const { data: grupos } = await supabase
    .from('grupos')
    .select('*')
    .in('id', grupoIds)
    .order('created_at', { ascending: false })

  // Fetch all integrantes across all groups
  const { data: integrantes } = grupoIds.length > 0
    ? await supabase
        .from('integrantes')
        .select('*, grupo:grupo_id(nome)')
        .in('grupo_id', grupoIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Fetch recent audit log
  const { data: auditLog } = await supabase
    .from('auditoria')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch contribuicoes pendentes
  const { data: pendentes } = grupoIds.length > 0
    ? await supabase
        .from('contribuicoes')
        .select('*, integrante:integrante_id(nome), grupo:grupo_id(nome)')
        .in('grupo_id', grupoIds)
        .eq('estado', 'pendente')
        .order('created_at', { ascending: false })
    : { data: [] }

  // Stats
  const totalMembros = integrantes?.length ?? 0
  const membrosActivos = integrantes?.filter(i => i.estado === 'activo').length ?? 0
  const membrosComToken = integrantes?.filter(i => i.token_acesso).length ?? 0
  const totalGrupos = grupos?.length ?? 0
  const totalPendentes = pendentes?.length ?? 0
  const valorPendente = pendentes?.reduce((s, c) => s + (c.valor ?? 0), 0) ?? 0

  const acaoLabel = (accao: string) => {
    const labels: Record<string, string> = {
      criar_grupo: 'Criou grupo',
      atualizar_grupo: 'Actualizou grupo',
      criar_integrante: 'Adicionou membro',
      registar_contribuicao: 'Registou contribuição',
      confirmado_contribuicao: 'Confirmou pagamento',
      rejeitado_contribuicao: 'Rejeitou pagamento',
      pagamento_beneficiario: 'Pagou beneficiário',
      criar_ronda: 'Criou ronda',
    }
    return labels[accao] ?? accao
  }

  const acaoIcon = (accao: string) => {
    if (accao.startsWith('criar')) return '✦'
    if (accao.startsWith('confirm')) return '✓'
    if (accao.startsWith('rejeit')) return '✗'
    if (accao.startsWith('pagam')) return '💸'
    return '○'
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Painel de Administração</h1>
            <p className="page-subtitle">Visão geral de todos os grupos e membros</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/dashboard/grupos/novo" className="btn btn-secondary">+ Novo Grupo</Link>
            <Link href="/dashboard/integrantes/novo" className="btn btn-primary">+ Novo Membro</Link>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid mb-6">
        <div className="kpi-card blue">
          <div className="kpi-label">Grupos Activos</div>
          <div className="kpi-value">{totalGrupos}</div>
          <div className="kpi-sub">Geridos por si</div>
          <div className="kpi-icon">⬡</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Total de Membros</div>
          <div className="kpi-value green">{totalMembros}</div>
          <div className="kpi-sub">{membrosActivos} activos</div>
          <div className="kpi-icon">◉</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Links Enviados</div>
          <div className="kpi-value green">{membrosComToken}</div>
          <div className="kpi-sub">de {totalMembros} membros</div>
          <div className="kpi-icon">🔗</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Contribuições Pendentes</div>
          <div className="kpi-value red">{totalPendentes}</div>
          <div className="kpi-sub">{formatarMoeda(valorPendente)} por confirmar</div>
          <div className="kpi-icon">⚠</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>

        {/* Grupos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Grupos</span>
            <Link href="/dashboard/grupos" className="btn btn-ghost btn-sm">Ver todos →</Link>
          </div>
          {grupos && grupos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grupos.map(g => {
                const membrosGrupo = integrantes?.filter(i => i.grupo_id === g.id).length ?? 0
                return (
                  <Link
                    key={g.id}
                    href={`/dashboard/grupos/${g.id}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      borderRadius: 10,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    className="hover-card-row"
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{g.nome}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                        {formatarMoeda(g.valor_contribuicao)} · {g.frequencia} · {membrosGrupo}/{g.num_membros} membros
                      </div>
                    </div>
                    <span className={`badge ${g.estado === 'activo' ? 'badge-green' : 'badge-red'}`}>
                      {g.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-icon" style={{ fontSize: 28 }}>⬡</div>
              <div className="empty-state-title" style={{ fontSize: 14 }}>Sem grupos</div>
            </div>
          )}
        </div>

        {/* Contribuições Pendentes */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">A aguardar confirmação</span>
            <Link href="/dashboard/contribuicoes" className="btn btn-ghost btn-sm">Ver todas →</Link>
          </div>
          {pendentes && pendentes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendentes.slice(0, 6).map((c: any) => (
                <div key={c.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.integrante?.nome ?? '—'}</div>
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

        {/* Integrantes recentes */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Membros Recentes</span>
            <Link href="/dashboard/integrantes" className="btn btn-ghost btn-sm">Ver todos →</Link>
          </div>
          {integrantes && integrantes.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Grupo</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {integrantes.slice(0, 6).map((i: any) => (
                    <tr key={i.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{i.nome}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {i.conta_destino ?? 'Dados por preencher'}
                        </div>
                      </td>
                      <td><span className="badge badge-blue">{i.grupo?.nome ?? '—'}</span></td>
                      <td>
                        <span style={{ fontSize: 12 }}>
                          {i.conta_destino ? '✓ Preenchido' : <span style={{ color: 'var(--amber-400)' }}>⏳ Pendente</span>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-title" style={{ fontSize: 14 }}>Sem membros</div>
            </div>
          )}
        </div>

        {/* Audit Log */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Registo de Actividade</span>
            <Link href="/dashboard/auditoria" className="btn btn-ghost btn-sm">Histórico →</Link>
          </div>
          {auditLog && auditLog.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {auditLog.map((a, idx) => (
                <div key={a.id} style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: '12px 0',
                  borderBottom: idx < auditLog.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'var(--bg-input)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, flexShrink: 0,
                  }}>
                    {acaoIcon(a.accao)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{acaoLabel(a.accao)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {a.usuario_nome} · {formatarData(a.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-title" style={{ fontSize: 14 }}>Sem actividade</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
