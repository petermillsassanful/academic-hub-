'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

interface TopBarProps {
  profile: Profile
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function TopBar({ profile }: TopBarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const initials = getInitials(profile.full_name)
  const isAdmin = profile.role === 'admin'

  return (
    <header
      id="topbar"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: '240px',
        // Grow the bar under the notch and pad its content down so nothing
        // is hidden behind it (item 2). On devices with no inset this is 0.
        height: 'calc(64px + env(safe-area-inset-top))',
        paddingTop: 'env(safe-area-inset-top)',
        background: 'rgba(10,15,30,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1E293B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'env(safe-area-inset-top) max(24px, env(safe-area-inset-right)) 0 max(24px, env(safe-area-inset-left))',
        zIndex: 30,
      }}
      className="topbar"
    >
      {/* Left: Page context (can be extended later) */}
      <div />

      {/* Right: User info + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Role badge */}
        <span className={isAdmin ? 'badge-admin' : 'badge-student'}>
          {isAdmin ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>
          )}
          {isAdmin ? 'Lecturer' : 'Student'}
        </span>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Avatar */}
          <div
            id="user-avatar"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '700',
              color: '#FFFFFF',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(79,70,229,0.4)',
            }}
            aria-label={`Avatar for ${profile.full_name ?? profile.email}`}
          >
            {initials}
          </div>

          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column' }} className="topbar-name">
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', lineHeight: 1.2 }}>
              {profile.full_name ?? 'User'}
            </span>
            <span style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.2 }}>
              {profile.email}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '28px', background: '#1E293B' }} />

        {/* Logout */}
        <button
          id="logout-button"
          onClick={handleLogout}
          className="btn-danger"
          style={{ padding: '7px 14px', fontSize: '13px' }}
          aria-label="Sign out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .topbar { left: 0 !important; }
          .topbar-name { display: none !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .topbar { left: 64px !important; }
        }
      `}</style>
    </header>
  )
}
