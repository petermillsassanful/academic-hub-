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
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()
  if (!profile) redirect('/login')

  return (
    <div style={{ maxWidth: '720px' }}>
      <h1
        style={{
          fontSize: '26px',
          fontWeight: 800,
          color: '#0F172A',
          letterSpacing: '-0.02em',
          marginBottom: '6px',
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
