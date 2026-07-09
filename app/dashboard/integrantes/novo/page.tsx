'use client'

import { useActionState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { criarIntegrante } from '@/app/actions/xitique'
import Link from 'next/link'

function NovoIntegranteForm() {
  const [state, action, pending] = useActionState(criarIntegrante, undefined)
  const router = useRouter()
  const searchParams = useSearchParams()
  const grupoId = searchParams.get('grupo_id') ?? ''

  useEffect(() => {
    if (state?.success) {
      router.push('/dashboard/integrantes')
    }
  }, [state, router])

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Adicionar Membro</h1>
            <p className="page-subtitle">Cadastrar um novo integrante no grupo</p>
          </div>
          <Link href="/dashboard/integrantes" className="btn btn-secondary">← Voltar</Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <form action={action}>
          {state?.error && (
            <div className="alert alert-red mb-4">
              <span>⚠️</span>
              <span>{state.error}</span>
            </div>
          )}

          <input type="hidden" name="grupo_id" value={grupoId} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!grupoId && (
              <div className="alert alert-amber">
                <span>💡</span>
                <span>Dica: Para associar a um grupo automaticamente, adicione membros pela página do grupo.</span>
              </div>
            )}

            {/* Informação básica — obrigatória */}
            <div className="form-group">
              <label htmlFor="nome" className="form-label">Nome completo <span>*</span></label>
              <input id="nome" name="nome" className="form-input" placeholder="Ex: Ana Mausse" required />
            </div>

            <div className="form-group">
              <label htmlFor="contacto" className="form-label">Contacto telefónico</label>
              <input id="contacto" name="contacto" className="form-input" placeholder="Ex: 84 123 4567" />
              <span className="form-hint">O membro pode preencher os seus dados de pagamento pelo link de convite.</span>
            </div>

            <div className="form-group">
              <label htmlFor="posicao_ordem" className="form-label">Posição na ordem de recebimento</label>
              <input id="posicao_ordem" name="posicao_ordem" type="number" min={1} className="form-input" placeholder="Ex: 1 (primeira a receber)" />
              <span className="form-hint">Pode deixar em branco — o membro escolhe a sua posição pelo link.</span>
            </div>

            {/* Separador — dados de pagamento opcionais */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔗</span>
                <span>Os campos abaixo são <strong>opcionais</strong>. Após adicionar o membro, copie o <strong>Link de Convite</strong> e envie-lhe pelo WhatsApp. O membro preencherá os seus próprios dados.</span>
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="metodo_recebimento" className="form-label">Método de recebimento</label>
                  <select id="metodo_recebimento" name="metodo_recebimento" className="form-input">
                    <option value="">Seleccionar…</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="emola">e-Mola</option>
                    <option value="banco">Banco</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="conta_destino" className="form-label">Nº da conta / telemóvel</label>
                  <input id="conta_destino" name="conta_destino" className="form-input" placeholder="Ex: 84 123 4567" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="nome_conta" className="form-label">Nome da conta</label>
                <input id="nome_conta" name="nome_conta" className="form-input" placeholder="Ex: Ana Mausse" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="observacoes" className="form-label">Observações</label>
              <textarea id="observacoes" name="observacoes" className="form-input" placeholder="Notas adicionais (opcional)" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
            <Link href="/dashboard/integrantes" className="btn btn-secondary">Cancelar</Link>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? (
                <><span className="loading-spinner" style={{ width: 16, height: 16 }} /> A adicionar…</>
              ) : 'Adicionar e Gerar Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NovoIntegrantePage() {
  return (
    <Suspense fallback={<div className="page-header"><h1 className="page-title">A carregar…</h1></div>}>
      <NovoIntegranteForm />
    </Suspense>
  )
}
