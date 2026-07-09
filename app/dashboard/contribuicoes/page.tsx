import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RealtimeContribuicoesTable from '@/components/RealtimeContribuicoesTable'

export default async function ContribuicoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch all contributions for user's groups
  const { data: membros } = await supabase
    .from('grupo_membros')
    .select('grupo_id, role')
    .eq('user_id', user.id)

  const grupoIds = membros?.map(m => m.grupo_id) ?? []
  const isAdmin = membros?.some(m => m.role === 'admin') ?? false

  let contribuicoes = []
  if (grupoIds.length > 0) {
    const { data } = await supabase
      .from('contribuicoes')
      .select(`
        *,
        integrante:integrante_id(nome, contacto),
        grupo:grupo_id(nome),
        ronda:ronda_id(nome)
      `)
      .in('grupo_id', grupoIds)
      .order('created_at', { ascending: false })
    contribuicoes = data ?? []
  }



  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Contribuições</h1>
            <p className="page-subtitle">Histórico de pagamentos e comprovativos</p>
          </div>
          <Link href="/dashboard/contribuicoes/nova" className="btn btn-primary">
            + Registar Contribuição
          </Link>
        </div>
      </div>

      <div className="card">
        <RealtimeContribuicoesTable 
          contribuicoesIniciais={contribuicoes} 
          grupoIds={grupoIds} 
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
