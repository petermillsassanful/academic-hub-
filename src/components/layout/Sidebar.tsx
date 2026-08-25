'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/types/database'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

function CoursesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="9" y1="7" x2="15" y2="7"/>
      <line x1="9" y1="11" x2="13" y2="11"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

interface SidebarProps {
  role: Role
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const basePath = role === 'admin' ? '/admin' : '/student'

  const navItems: NavItem[] = [
    {
      href: basePath,
      label: 'Dashboard',
      icon: <DashboardIcon />,
    },
    {
      href: `${basePath}/courses`,
      label: 'My Courses',
      icon: <CoursesIcon />,
    },
  ]

  const settingsItem: NavItem = {
    href: '/settings',
    label: 'Settings',
    icon: <SettingsIcon />,
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="sidebar-desktop"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '240px',
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          transition: 'width 200ms ease',
          boxShadow: '1px 0 3px rgba(0,0,0,0.02)',
        }}
        className="hidden-mobile sidebar-desktop"
      >
        {/* Logo Area */}
        <div style={{
          height: '60px',
          padding: '0 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#1B2559', // Matching topbar
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            flexShrink: 0,
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="sidebar-label">
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              Academic Hub
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 10px 8px' }} className="sidebar-label">
            Navigation
          </div>
          {[...navItems, settingsItem].map((item) => {
            const isActive = pathname === item.href || (item.href !== basePath && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'all 150ms ease',
                  background: isActive ? '#EFF6FF' : 'transparent',
                  border: isActive ? '1px solid #BFDBFE' : '1px solid transparent',
                  color: isActive ? '#1D4ED8' : '#334155',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '13px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#F8FAFC'
                    e.currentTarget.style.color = '#0F172A'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#334155'
                  }
                }}
              >
                <span style={{ color: isActive ? '#2563EB' : '#475569', display: 'flex' }}>
                  {item.icon}
                </span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
        }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '500', textAlign: 'center' }}>
            Academic Hub LMS v1.0
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile navigation"
        className="mobile-tab-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(60px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 50,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        }}
      >
        {[...navItems, settingsItem].map((item) => {
          const isActive = pathname === item.href || (item.href !== basePath && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                color: isActive ? '#1D4ED8' : '#64748B',
                textDecoration: 'none',
                fontSize: '11px',
                fontWeight: isActive ? '600' : '400',
                padding: '6px 16px',
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <style>{`
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .mobile-tab-bar { display: flex !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .sidebar-desktop { width: 64px !important; }
          .sidebar-label { display: none !important; }
        }
      `}</style>
    </>
  )
}
