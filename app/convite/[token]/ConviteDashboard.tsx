'use client'

import { useState } from 'react'
import ConviteForm from './ConviteForm'
import SubmeterPagamento from './SubmeterPagamento'
import { formatarMoeda, calcularPorcentagem, iniciais, corAvatar } from '@/lib/utils'

interface Props {
  payload: {
    integrante: any
    grupo: any
    ordem_ocupada: any[]
    ronda_actual: any
    progresso: { esperado: number, confirmado: number }
    membros: any[]
  }
  token: string
}

export default function ConviteDashboard({ payload, token }: Props) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dados' | 'pagamento'>('dashboard')
  
  const { integrante, grupo, ronda_actual, progresso, membros, ordem_ocupada } = payload
  const pct = calcularPorcentagem(progresso.confirmado, progresso.esperado)

  // Verify if the user already paid in this round.
  // In a real app we'd get this from the payload.
  // For demo, we just allow submission if there's an active round.

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        background: 'var(--bg-card)', 
        padding: 8, 
        borderRadius: 16, 
        marginBottom: 24,
        border: '1px solid var(--border)'
      }}>
        <button 
          className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Ponto de Situação
        </button>
        <button 
          className={`btn ${activeTab === 'dados' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('dados')}
        >
          ⚙️ Meus Dados
        </button>
        {ronda_actual && (
          <button 
            className={`btn ${activeTab === 'pagamento' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => setActiveTab('pagamento')}
          >
            📸 Submeter Recibo
          </button>
        )}
      </div>

      {activeTab === 'pagamento' && ronda_actual && (
        <SubmeterPagamento 
          token={token}
          rondaId={ronda_actual.id}
          valorEsperado={grupo.valor_contribuicao}
          onSuccess={() => {
            setActiveTab('dashboard')
            // Opcional: mostrar um toast ou alert de sucesso aqui
            alert('Pagamento submetido e analisado com sucesso!')
          }}
        />
      )}

      {activeTab === 'dados' && (
        <ConviteForm 
          integrante={integrante} 
          grupo={grupo} 
          ordemOcupada={ordem_ocupada} 
          token={token} 
        />
      )}

      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Header Info */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Grupo de Xitique</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0' }}>{grupo.nome}</h1>
              <div style={{ fontSize: 14, color: 'var(--green-400)' }}>
                {formatarMoeda(grupo.valor_contribuicao)} • {grupo.frequencia}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Membro Activo</div>
              <div style={{ fontWeight: 600 }}>{integrante.nome}</div>
              <div className="badge badge-green mt-1">{integrante.posicao_ordem ? `${integrante.posicao_ordem}º a receber` : 'Posição não escolhida'}</div>
            </div>
          </div>

          {/* Ronda em Curso */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Ronda Actual</h2>
            
            {ronda_actual ? (
              <div className="grid-2" style={{ gap: 24 }}>
                <div style={{ background: 'var(--bg-input)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Quem recebe agora</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div 
                      className="avatar" 
                      style={{ 
                        background: corAvatar(ronda_actual.beneficiario_nome || '?') + '33', 
                        color: corAvatar(ronda_actual.beneficiario_nome || '?') 
                      }}
                    >
                      {iniciais(ronda_actual.beneficiario_nome || '?')}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                      {ronda_actual.beneficiario_nome || 'A definir'}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Progresso da Recolha</span>
                    <span style={{ fontWeight: 600, color: 'var(--green-400)' }}>{pct}%</span>
                  </div>
                  
                  <div className="progress-container mb-3">
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Confirmado: <strong style={{ color: 'var(--text-primary)' }}>{formatarMoeda(progresso.confirmado)}</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>Alvo: <strong>{formatarMoeda(progresso.esperado)}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div>A aguardar início de nova ronda pelo administrador.</div>
              </div>
            )}
          </div>

          {/* Lista de Membros */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Lista de Participantes</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ordem</th>
                    <th>Nome do Membro</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {membros.map((m: any, idx: number) => (
                    <tr key={idx} style={{ background: m.sou_eu ? 'rgba(34,197,94,0.05)' : 'transparent' }}>
                      <td style={{ fontWeight: m.posicao_ordem ? 600 : 400, color: m.posicao_ordem ? 'inherit' : 'var(--text-muted)' }}>
                        {m.posicao_ordem ? `${m.posicao_ordem}º` : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {m.nome}
                          {m.sou_eu && <span className="badge badge-green" style={{ fontSize: 10 }}>Você</span>}
                        </div>
                      </td>
                      <td>
                        {m.posicao_ordem 
                          ? <span style={{ color: 'var(--green-500)', fontSize: 12 }}>✓ Pronto</span>
                          : <span style={{ color: 'var(--amber-500)', fontSize: 12 }}>⏳ Falta preencher dados</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div style={{
        marginTop: 40,
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--text-muted)'
      }}>
        Xitique Fácil — Desenvolvido por{' '}
        <a 
          href="https://nexovibe.netlify.app/" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ color: 'var(--green-400)', textDecoration: 'none', fontWeight: 600 }}
        >
          Nexo Vibe
        </a>
      </div>
    </div>
  )
}
