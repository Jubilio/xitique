'use client'

import { useActionState } from 'react'
import { criarGrupo } from '@/app/actions/xitique'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NovoGrupoPage() {
  const [state, action, pending] = useActionState(criarGrupo, undefined)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      router.push('/dashboard/grupos')
    }
  }, [state, router])

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Novo Grupo</h1>
            <p className="page-subtitle">Configure um novo grupo de Xitique</p>
          </div>
          <Link href="/dashboard/grupos" className="btn btn-secondary">← Voltar</Link>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label htmlFor="nome" className="form-label">Nome do grupo <span>*</span></label>
              <input id="nome" name="nome" className="form-input" placeholder="Ex: Xitique Família" required />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="valor_contribuicao" className="form-label">
                  Valor por contribuição (MT) <span>*</span>
                </label>
                <input
                  id="valor_contribuicao"
                  name="valor_contribuicao"
                  type="number"
                  min={1}
                  className="form-input"
                  placeholder="2000"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="num_membros" className="form-label">Número de membros <span>*</span></label>
                <input
                  id="num_membros"
                  name="num_membros"
                  type="number"
                  min={2}
                  max={100}
                  className="form-input"
                  placeholder="10"
                  required
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="frequencia" className="form-label">Frequência <span>*</span></label>
                <select id="frequencia" name="frequencia" className="form-input" required>
                  <option value="">Seleccionar…</option>
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="data_inicio" className="form-label">Data de início <span>*</span></label>
                <input id="data_inicio" name="data_inicio" type="date" className="form-input" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="metodo_rotacao" className="form-label">Método de rotação <span>*</span></label>
              <select id="metodo_rotacao" name="metodo_rotacao" className="form-input" required>
                <option value="">Seleccionar…</option>
                <option value="fixo">Ordem fixa (definida no cadastro)</option>
                <option value="manual">Manual (admin define cada ronda)</option>
              </select>
              <span className="form-hint">Define como é determinada a ordem de quem recebe.</span>
            </div>

            <div className="form-group">
              <label htmlFor="descricao" className="form-label">Descrição</label>
              <textarea id="descricao" name="descricao" className="form-input" placeholder="Notas sobre o grupo (opcional)" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
            <Link href="/dashboard/grupos" className="btn btn-secondary">Cancelar</Link>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? (
                <><span className="loading-spinner" style={{ width: 16, height: 16 }} /> A criar…</>
              ) : 'Criar Grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
