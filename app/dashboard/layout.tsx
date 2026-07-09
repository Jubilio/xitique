import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user profile and role
  const userName = (user.user_metadata?.nome as string) ?? user.email ?? 'Utilizador'

  // Check if user is admin of any group
  const { data: membros } = await supabase
    .from('grupo_membros')
    .select('role')
    .eq('user_id', user.id)

  const isAdmin = membros?.some(m => m.role === 'admin') ?? false

  return (
    <div className="app-layout">
      <Sidebar userName={userName} userEmail={user.email ?? ''} isAdmin={isAdmin} />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
