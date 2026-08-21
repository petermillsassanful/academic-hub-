import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getUser, getProfile } from '@/lib/auth'
import { SettingsClient } from './SettingsClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Settings — Academic Hub',
  description: 'Manage your account.',
}

export default async function SettingsPage() {
  // Cached — shared with the (dashboard) layout guard, no extra network call.
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()
  if (!profile) redirect('/login')

  return (
    <div>
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          marginBottom: '4px',
        }}
      >
        Settings
      </h1>
      <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>
        Manage your account and preferences.
      </p>
      <SettingsClient profile={profile} />
    </div>
  )
}
