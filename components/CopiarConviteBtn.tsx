'use client'

import { useState } from 'react'

export default function CopiarConviteBtn({ token }: { token: string }) {
  const [copiado, setCopiado] = useState(false)

  const handleCopiar = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/convite/${token}`
    
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      console.error('Falha ao copiar:', err)
    }
  }

  return (
    <button 
      onClick={handleCopiar} 
      className="btn btn-ghost btn-sm"
      style={{ color: copiado ? 'var(--green-400)' : 'var(--text-secondary)' }}
    >
      {copiado ? '✓ Copiado' : '📋 Copiar Link'}
    </button>
  )
}
