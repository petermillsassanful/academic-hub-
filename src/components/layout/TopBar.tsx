'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { NotificationBell } from './NotificationBell'

interface TopBarProps {
  profile: Profile
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function TopBar({ profile }: TopBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const initials = getInitials(profile.full_name)
  const isAdmin = profile.role === 'admin'
  const basePath = isAdmin ? '/admin' : '/student'

  const navLinks = [
    { href: basePath, label: 'Dashboard' },
    { href: `${basePath}/courses`, label: 'My Courses' },
    { href: '/settings', label: 'Settings' },
  ]

  return (
    <header
      id="topbar"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: '240px',
        height: 'calc(60px + env(safe-area-inset-top))',
        paddingTop: 'env(safe-area-inset-top)',
        background: '#1B2559', // University Deep Navy Blue
        borderBottom: '1px solid #141B44',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'env(safe-area-inset-top) max(24px, env(safe-area-inset-right)) 0 max(24px, env(safe-area-inset-left))',
        zIndex: 30,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      className="topbar"
    >
      {/* Left: Brand / Navigation links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="hidden-mobile">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#FFFFFF'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Right: Notifications, Role, User Profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Real Dynamic Notification Bell */}
        <NotificationBell userId={profile.id} />

        {/* Role badge */}
        <span style={{
          padding: '3px 8px',
          borderRadius: '99px',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          background: isAdmin ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          border: isAdmin ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
          color: isAdmin ? '#FCD34D' : '#6EE7B7',
        }}>
          {isAdmin ? '★ Lecturer' : '● Student'}
        </span>

        {/* User Avatar Circle */}
        <div
          id="user-avatar"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: '#FFFFFF',
            color: '#1B2559',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '700',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
          aria-label={`Avatar for ${profile.full_name ?? profile.email}`}
        >
          {initials}
        </div>

        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column' }} className="topbar-name">
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', lineHeight: 1.2 }}>
            {profile.full_name ?? 'User'}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.2 }}>
            {profile.email}
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />

        {/* Logout */}
        <button
          id="logout-button"
          onClick={handleLogout}
          style={{
            padding: '6px 12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#FCA5A5',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
            e.currentTarget.style.color = '#FFFFFF'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
            e.currentTarget.style.color = '#FCA5A5'
          }}
          aria-label="Sign out"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .topbar { left: 0 !important; }
          .topbar-name { display: none !important; }
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .topbar { left: 64px !important; }
        }
      `}</style>
    </header>
  )
}
