'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="auth-page">
      <div className="auth-card animate-in">
        <div className="auth-logo">XF</div>
        <h1 className="auth-title">Bem-vindo de volta</h1>
        <p className="auth-subtitle">Aceda ao seu grupo de Xitique</p>

        <form action={action} className="auth-form">
          {state?.error && (
            <div className="alert alert-red">
              <span>⚠️</span>
              <span>{state.error}</span>
            </div>
          )}

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
              placeholder="••••••••"
              autoComplete="current-password"
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
                A entrar…
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="auth-link">
          Não tem conta?{' '}
          <Link href="/register">Criar conta</Link>
        </p>
      </div>
    </div>
  )
}
