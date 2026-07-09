'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error: string }> {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Preencha todos os campos.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login')) {
      return { error: 'Email ou palavra-passe incorrectos.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Email não confirmado. Verifique a sua caixa de entrada ou desactive a confirmação de email nas configurações do Supabase (Authentication → Settings → desmarque "Enable email confirmations").' }
    }
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function register(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error: string }> {
  const supabase = await createClient()

  const nome = String(formData.get('nome') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm_password') ?? '')

  if (!nome || !email || !password) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  if (password !== confirm) {
    return { error: 'As palavras-passe não coincidem.' }
  }

  if (password.length < 6) {
    return { error: 'A palavra-passe deve ter pelo menos 6 caracteres.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Este email já está registado. Faça login.' }
    }
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
