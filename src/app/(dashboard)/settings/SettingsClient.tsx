'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { deleteAccount } from './actions'
import type { Profile } from '@/types/database'

interface SettingsClientProps {
  profile: Profile
}

// Exact copy required for App Store account-deletion compliance (item 7).
const DELETE_WARNING =
  'This will permanently delete your account and all your data. This cannot be undone.'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 0',
        borderBottom: '1px solid #1E293B',
      }}
    >
      <span style={{ fontSize: '13px', color: '#64748B' }}>{label}</span>
      <span
        className="selectable-content"
        style={{
          fontSize: '14px',
          color: '#E2E8F0',
          fontWeight: 500,
          textAlign: 'right',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
    </div>
  )
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirmDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteAccount()
      // A successful delete redirects (throws), so we only get here on failure.
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  const roleLabel = profile.role === 'admin' ? 'Lecturer' : 'Student'

  return (
    <div style={{ maxWidth: '640px' }}>
      {/* Account details */}
      <section className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: '4px',
          }}
        >
          Account
        </h2>
        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
          Your profile information.
        </p>
        <Row label="Name" value={profile.full_name ?? '—'} />
        <Row label="Email" value={profile.email} />
        <Row label="Role" value={roleLabel} />
        {profile.index_number && <Row label="Index number" value={profile.index_number} />}
        {profile.level && <Row label="Level" value={profile.level} />}
      </section>

      {/* Danger zone */}
      <section
        style={{
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.05)',
        }}
      >
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#EF4444',
            marginBottom: '4px',
          }}
        >
          Delete Account
        </h2>
        <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px', lineHeight: 1.5 }}>
          {DELETE_WARNING}
        </p>
        <button
          id="open-delete-account"
          className="btn-danger"
          onClick={() => {
            setError(null)
            setIsOpen(true)
          }}
          style={{ minHeight: '44px' }}
        >
          Delete Account
        </button>
      </section>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!isPending) setIsOpen(false)
        }}
        title="Delete Account"
        maxWidth={460}
      >
        <p style={{ fontSize: '14px', color: '#E2E8F0', lineHeight: 1.6, marginBottom: '20px' }}>
          {DELETE_WARNING}
        </p>

        {error && (
          <div
            role="alert"
            style={{
              fontSize: '13px',
              color: '#FCA5A5',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            className="btn-ghost"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            style={{ minHeight: '44px' }}
          >
            Cancel
          </button>
          <button
            id="confirm-delete-account"
            className="btn-danger"
            onClick={handleConfirmDelete}
            disabled={isPending}
            style={{ minHeight: '44px' }}
          >
            {isPending ? 'Deleting…' : 'Delete Account'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
