import { createClient } from '@/lib/supabase/server'
import { formatarMoeda, formatarData, calcularPorcentagem, iniciais, corAvatar } from '@/lib/utils'
import type { Ronda, Integrante, Grupo } from '@/lib/types'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch grupos do utilizador
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
      .eq('estado', 'activo')
    grupos = data ?? []
  }

  // Fetch ronda activa para o primeiro grupo
  const grupoAtual = grupos[0]
  let rondaAtual: Ronda | null = null
  let beneficiarioAtual: Integrante | null = null
  let proximoBeneficiario: Integrante | null = null
  let totalEsperado = 0
  let totalConfirmado = 0
  let contribuicoesPendentes = 0

  if (grupoAtual) {
    const { data: rondas } = await supabase
      .from('rondas')
      .select('*, beneficiario:beneficiario_id(id, nome, contacto, metodo_recebimento, conta_destino)')
      .eq('grupo_id', grupoAtual.id)
      .eq('estado', 'em_curso')
      .order('created_at', { ascending: false })
      .limit(1)
    rondaAtual = rondas?.[0] ?? null
    beneficiarioAtual = (rondaAtual as any)?.beneficiario ?? null

    if (rondaAtual) {
      const { data: contribs } = await supabase
        .from('contribuicoes')
        .select('valor, estado')
        .eq('ronda_id', rondaAtual.id)

      totalEsperado = grupoAtual.valor_contribuicao * grupoAtual.num_membros
      totalConfirmado = contribs?.filter(c => c.estado === 'confirmado').reduce((s, c) => s + c.valor, 0) ?? 0
      contribuicoesPendentes = contribs?.filter(c => c.estado === 'pendente').length ?? 0
    }

    // Next beneficiary from ordem_recebimento
    const { data: ordemProx } = await supabase
      .from('ordem_recebimento')
      .select('*, integrante:integrante_id(id, nome, contacto)')
      .eq('grupo_id', grupoAtual.id)
      .eq('estado', 'pendente')
      .order('posicao', { ascending: true })
      .limit(2)

    // Skip current beneficiary
    const proxItem = ordemProx?.find(o => o.integrante_id !== beneficiarioAtual?.id)
    proximoBeneficiario = (proxItem as any)?.integrante ?? null
  }

  const emFalta = totalEsperado - totalConfirmado
  const pct = calcularPorcentagem(totalConfirmado, totalEsperado)

  // Recent contributions
  const { data: contribuicoes } = grupoAtual ? await supabase
    .from('contribuicoes')
    .select('*, integrante:integrante_id(nome)')
    .eq('grupo_id', grupoAtual.id)
    .order('created_at', { ascending: false })
    .limit(5) : { data: [] }

  const estadoBadge = (estado: string) => {
    if (estado === 'confirmado') return 'badge-green'
    if (estado === 'rejeitado') return 'badge-red'
    return 'badge-amber'
  }
  const estadoLabel = (estado: string) =>
    estado === 'confirmado' ? 'Confirmado' :
    estado === 'rejeitado' ? 'Rejeitado' : 'Pendente'

  if (grupos.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Bem-vindo ao Xitique Fácil</p>
        </div>
        <div className="empty-state card" style={{ padding: 60 }}>
          <div className="empty-state-icon">⬡</div>
          <div className="empty-state-title">Sem grupos ainda</div>
          <p className="empty-state-desc">
            Crie o seu primeiro grupo de Xitique para começar, ou aguarde ser convidado.
          </p>
          <Link href="/dashboard/grupos/novo" className="btn btn-primary">
            + Criar Grupo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              {grupoAtual?.nome} · {rondaAtual?.nome ?? 'Sem ronda activa'}
            </p>
          </div>
          {isAdmin && rondaAtual && (
            <Link href="/dashboard/contribuicoes/nova" className="btn btn-primary">
              + Registar Contribuição
            </Link>
          )}
        </div>
      </div>

      {/* Beneficiário actual */}
      {beneficiarioAtual && (
        <div className="grid-2 mb-6">
          <div className="beneficiario-card">
            <div
              className="avatar avatar-lg"
              style={{ background: corAvatar(beneficiarioAtual.nome) + '33', color: corAvatar(beneficiarioAtual.nome) }}
            >
              {iniciais(beneficiarioAtual.nome)}
            </div>
            <div className="beneficiario-card-info">
              <div className="beneficiario-card-label">🎯 Recebe Agora</div>
              <div className="beneficiario-card-name">{beneficiarioAtual.nome}</div>
              <div className="beneficiario-card-sub">{beneficiarioAtual.contacto}</div>
            </div>
          </div>

          {proximoBeneficiario && (
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                className="avatar avatar-lg"
                style={{ background: corAvatar(proximoBeneficiario.nome) + '22', color: corAvatar(proximoBeneficiario.nome), opacity: 0.7 }}
              >
                {iniciais(proximoBeneficiario.nome)}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ⏭ Próximo
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{proximoBeneficiario.nome}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{proximoBeneficiario.contacto}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-label">Membros Activos</div>
          <div className="kpi-value">{grupoAtual?.num_membros}</div>
          <div className="kpi-sub">{grupoAtual?.nome}</div>
          <div className="kpi-icon">◉</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Total Esperado</div>
          <div className="kpi-value green">{formatarMoeda(totalEsperado)}</div>
          <div className="kpi-sub">Esta ronda</div>
          <div className="kpi-icon">⊕</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Confirmado</div>
          <div className="kpi-value green">{formatarMoeda(totalConfirmado)}</div>
          <div className="progress-container">
            <div className="progress-label">
              <span>{pct}% recolhido</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="kpi-icon">◎</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Em Falta</div>
          <div className="kpi-value red">{formatarMoeda(emFalta)}</div>
          <div className="kpi-sub">
            {contribuicoesPendentes > 0 ? `${contribuicoesPendentes} pendente(s)` : 'Tudo em dia ✓'}
          </div>
          <div className="kpi-icon">⚠</div>
        </div>
      </div>

      {/* Recent contributions table */}
      <div className="card mt-4">
        <div className="card-header">
          <span className="card-title">Contribuições Recentes</span>
          <Link href="/dashboard/contribuicoes" className="btn btn-ghost btn-sm">
            Ver todas →
          </Link>
        </div>
        {contribuicoes && contribuicoes.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Integrante</th>
                  <th>Valor</th>
                  <th>Método</th>
                  <th>Data</th>
                  <th>Estado</th>
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
                        {c.integrante?.nome ?? '—'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatarMoeda(c.valor)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.metodo?.toUpperCase()}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatarData(c.data_pagamento)}</td>
                    <td>
                      <span className={`badge badge-dot ${estadoBadge(c.estado)}`}>
                        {estadoLabel(c.estado)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-state-icon" style={{ fontSize: 32 }}>⊕</div>
            <div className="empty-state-title" style={{ fontSize: 15 }}>Sem contribuições ainda</div>
          </div>
        )}
      </div>
    </div>
  )
}
