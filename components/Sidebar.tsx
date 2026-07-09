'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { iniciais, corAvatar } from '@/lib/utils'

const navItems = [
  { href: '/dashboard/admin',         icon: '⚡',  label: 'Admin' },
  { href: '/dashboard',               icon: '◈',  label: 'Dashboard' },
  { href: '/dashboard/grupos',        icon: '⬡',  label: 'Grupos' },
  { href: '/dashboard/integrantes',   icon: '◉',  label: 'Integrantes' },
  { href: '/dashboard/contribuicoes', icon: '⊕',  label: 'Contribuições' },
  { href: '/dashboard/pagamentos',    icon: '◎',  label: 'Pagamentos' },
  { href: '/dashboard/auditoria',     icon: '≡',  label: 'Auditoria' },
]

interface Props {
  userName: string
  userEmail: string
  isAdmin: boolean
}

export default function Sidebar({ userName, userEmail, isAdmin }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const adminOnly = ['/dashboard/admin', '/dashboard/grupos', '/dashboard/pagamentos', '/dashboard/auditoria']
  const visibleNav = isAdmin ? navItems : navItems.filter(n => !adminOnly.includes(n.href))

  const avatarColor = corAvatar(userName)
  const initials = iniciais(userName)

  return (
    <>
      {/* Mobile header */}
      <header className="mobile-header">
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          ☰
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sidebar-logo" style={{ width: 32, height: 32, fontSize: 12 }}>XF</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Xitique Fácil</span>
        </div>
        <div style={{ width: 36 }} />
      </header>

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <nav className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">XF</div>
          <div className="sidebar-brand">
            <span className="sidebar-brand-name">Xitique Fácil</span>
            <span className="sidebar-brand-sub">Poupança Rotativa</span>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section-label">Navegação</div>
          {visibleNav.map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? 'active' : ''}
                onClick={() => setMobileOpen(false)}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div
              className="sidebar-user-avatar"
              style={{ background: avatarColor + '22', borderColor: avatarColor, color: avatarColor }}
            >
              {initials}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name truncate" title={userName}>{userName}</div>
              <div className="sidebar-user-role">{isAdmin ? '🔑 Admin' : '👤 Membro'}</div>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="btn btn-ghost w-full"
              style={{ justifyContent: 'flex-start', gap: 10, padding: '8px 12px', fontSize: 14, color: 'var(--text-muted)' }}
            >
              <span>⎋</span>
              Sair
            </button>
          </form>
          
          <div style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-muted)'
          }}>
            Desenvolvido por <a href="https://nexovibe.netlify.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green-400)', textDecoration: 'none', fontWeight: 600 }}>Nexo Vibe</a>
          </div>
        </div>
      </nav>
    </>
  )
}
