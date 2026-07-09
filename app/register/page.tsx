'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined)

  return (
    <div className="auth-page">
      <div className="auth-card animate-in">
        <div className="auth-logo">XF</div>
        <h1 className="auth-title">Criar conta</h1>
        <p className="auth-subtitle">Registe-se para gerir o seu Xitique</p>

        <form action={action} className="auth-form">
          {state?.error && (
            <div className="alert alert-red">
              <span>⚠️</span>
              <span>{state.error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="nome" className="form-label">
              Nome completo <span>*</span>
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              className="form-input"
              placeholder="O seu nome"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email <span>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="exemplo@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Palavra-passe <span>*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password" className="form-label">
              Confirmar palavra-passe <span>*</span>
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              className="form-input"
              placeholder="Repita a palavra-passe"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={pending}
            style={{ marginTop: 8 }}
          >
            {pending ? (
              <>
                <span className="loading-spinner" style={{ width: 16, height: 16 }} />
                A criar conta…
              </>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        <p className="auth-link">
          Já tem conta?{' '}
          <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
