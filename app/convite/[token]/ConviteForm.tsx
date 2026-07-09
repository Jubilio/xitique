'use client'

import { useActionState } from 'react'
import { atualizarMembroPorToken } from '@/app/actions/convite'

interface Props {
  integrante: any
  grupo: any
  ordemOcupada: { posicao: number, integrante_nome: string }[]
  token: string
}

export default function ConviteForm({ integrante, grupo, ordemOcupada, token }: Props) {
  const [state, action, pending] = useActionState(atualizarMembroPorToken, undefined)

  // Array das posições disponíveis (1 até num_membros)
  const posicoes = Array.from({ length: grupo.num_membros }, (_, i) => i + 1)
  
  // A posição actual deste membro
  const minhaPosicao = integrante.posicao_ordem

  return (
    <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>

      {state?.success ? (
        <div className="alert alert-green mb-6" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Dados Guardados com Sucesso!</h3>
          <p>O administrador do grupo já tem acesso às suas informações e ordem de recebimento.</p>
        </div>
      ) : (
        <form action={action}>
          {state?.error && (
            <div className="alert alert-red mb-4">
              <span>⚠️</span>
              <span>{state.error}</span>
            </div>
          )}

          <input type="hidden" name="token" value={token} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16 }}>
              1. Como pretende receber?
            </h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Método <span>*</span></label>
                <select name="metodo_recebimento" className="form-input" required defaultValue={integrante.metodo_recebimento || ''}>
                  <option value="">Seleccionar…</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="emola">e-Mola</option>
                  <option value="banco">Conta Bancária</option>
                  <option value="dinheiro">Dinheiro Físico</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nº da Conta / Telemóvel <span>*</span></label>
                <input name="conta_destino" className="form-input" required defaultValue={integrante.conta_destino || ''} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nome Registado na Conta <span>*</span></label>
              <input name="nome_conta" className="form-input" required defaultValue={integrante.nome_conta || ''} />
            </div>

            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, marginTop: 12 }}>
              2. Quando quer receber?
            </h3>

            <div className="form-group">
              <label className="form-label">Escolha a sua posição na ordem de recebimento</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                {posicoes.map(pos => {
                  const ocupada = ordemOcupada.find(o => o.posicao === pos)
                  const isMinha = minhaPosicao === pos
                  
                  return (
                    <label 
                      key={pos}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        border: `1px solid ${isMinha ? 'var(--green-500)' : ocupada ? 'var(--border)' : 'var(--bg-input)'}`,
                        background: isMinha ? 'rgba(34,197,94,0.1)' : ocupada ? 'var(--bg-body)' : 'var(--bg-input)',
                        cursor: ocupada && !isMinha ? 'not-allowed' : 'pointer',
                        opacity: ocupada && !isMinha ? 0.6 : 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <input 
                        type="radio" 
                        name="posicao" 
                        value={pos} 
                        disabled={!!ocupada && !isMinha}
                        defaultChecked={isMinha}
                        style={{ display: 'none' }}
                      />
                      <div style={{ fontWeight: 700, fontSize: 16, color: isMinha ? 'var(--green-400)' : 'inherit' }}>
                        {pos}º a receber
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                        {isMinha ? 'A sua escolha' : ocupada ? ocupada.integrante_nome : 'Livre'}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-4" disabled={pending} style={{ width: '100%', padding: '14px' }}>
              {pending ? (
                <><span className="loading-spinner" /> A guardar…</>
              ) : 'Confirmar e Guardar Dados'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
