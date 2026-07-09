import { createClient } from '@/lib/supabase/client' // use standard client, RPC bypasses RLS
import { notFound } from 'next/navigation'
import ConviteDashboard from './ConviteDashboard'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ConvitePage({ params }: PageProps) {
  const { token } = await params
  
  if (!token || token.length < 30) {
    notFound()
  }

  // Use the normal client to call the RPC function which has SECURITY DEFINER
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('get_dashboard_membro_por_token', {
    p_token: token
  })

  if (error || !data) {
    return (
      <div className="app-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <div className="empty-state card" style={{ padding: 40, maxWidth: 500 }}>
          <div className="empty-state-icon">🚫</div>
          <div className="empty-state-title">Link Inválido ou Expirado</div>
          <p className="empty-state-desc">
            Não foi possível encontrar o convite. Verifique se copiou o link completo ou contacte o administrador do seu grupo de Xitique.
          </p>
        </div>
      </div>
    )
  }

  const payload = data as any

  return (
    <div className="app-layout" style={{ minHeight: '100vh', padding: 20 }}>
      <header className="mobile-header" style={{ position: 'relative', top: 0, justifyContent: 'center', borderRadius: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sidebar-logo" style={{ width: 32, height: 32, fontSize: 12 }}>XF</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Xitique Fácil</span>
        </div>
      </header>

      <ConviteDashboard payload={payload} token={token} />
    </div>
  )
}
