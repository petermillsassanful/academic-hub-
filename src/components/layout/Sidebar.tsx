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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

function CoursesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="9" y1="7" x2="15" y2="7"/>
      <line x1="9" y1="11" x2="13" y2="11"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      label: 'Courses',
      icon: <CoursesIcon />,
    },
  ]

  // Settings lives outside the role-based tree and is shown as its own tab
  // on mobile (where the sidebar is hidden) so it stays reachable (item 7).
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
          background: 'rgba(10, 15, 30, 0.95)',
          borderRight: '1px solid #1E293B',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          transition: 'width 200ms ease',
        }}
        className="hidden-mobile sidebar-desktop"
      >
        {/* Logo Area */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="sidebar-label">
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              Academic Hub
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#334155', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px 8px' }} className="sidebar-label">
            Navigation
          </div>
          {[...navItems, settingsItem].map((item) => {
            const isActive = pathname === item.href || (item.href !== basePath && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.label.toLowerCase()}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 10px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  transition: 'all 150ms ease',
                  background: isActive ? 'rgba(79,70,229,0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(79,70,229,0.3)' : '1px solid transparent',
                  color: isActive ? '#FFFFFF' : '#64748B',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(30,41,59,0.6)'
                    e.currentTarget.style.color = '#94A3B8'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#64748B'
                  }
                }}
              >
                <span style={{
                  flexShrink: 0,
                  color: isActive ? '#818CF8' : 'inherit',
                }}>
                  {item.icon}
                </span>
                <span className="sidebar-label" style={{ fontSize: '14px', fontWeight: isActive ? '600' : '500' }}>
                  {item.label}
                </span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="sidebar-label"
                    style={{
                      marginLeft: 'auto',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#4F46E5',
                    }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

      </aside>

      {/* Mobile bottom tab bar (item 1) */}
      <nav
        id="mobile-tab-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(10,15,30,0.97)',
          borderTop: '1px solid #1E293B',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'none',
          zIndex: 50,
          // Pad above the iOS home indicator so tabs stay tappable (item 2).
          padding: '6px 0 calc(6px + env(safe-area-inset-bottom))',
        }}
        className="mobile-tab-bar"
      >
        {[...navItems, settingsItem].map((item) => {
          // Match the active tab the same way the desktop nav does, so a
          // nested route (e.g. /student/courses/[id]) keeps Courses lit.
          const isActive =
            pathname === item.href ||
            (item.href !== basePath && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                // 44px minimum tap target (item 4).
                minHeight: '44px',
                padding: '4px 8px',
                textDecoration: 'none',
                color: isActive ? '#818CF8' : '#64748B',
                fontSize: '11px',
                fontWeight: isActive ? '600' : '400',
                transition: 'color 150ms ease',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
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
