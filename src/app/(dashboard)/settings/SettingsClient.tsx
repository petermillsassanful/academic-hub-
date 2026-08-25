'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { deleteAccount } from './actions'
import type { Profile } from '@/types/database'

interface SettingsClientProps {
  profile: Profile
}

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
        padding: '14px 0',
        borderBottom: '1px solid #F1F5F9',
      }}
    >
      <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>{label}</span>
      <span
        className="selectable-content"
        style={{
          fontSize: '14px',
          color: '#0F172A',
          fontWeight: 600,
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
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  const roleLabel = profile.role === 'admin' ? 'Lecturer' : 'Student'

  return (
    <div style={{ maxWidth: '640px' }}>
      {/* Account details */}
      <section
        className="glass-card"
        style={{
          padding: '24px',
          marginBottom: '20px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: '4px',
          }}
        >
          Account Details
        </h2>
        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
          Your profile information
        </p>
        <Row label="Full Name" value={profile.full_name ?? '—'} />
        <Row label="Email Address" value={profile.email} />
        <Row label="Role" value={roleLabel} />
        {profile.index_number && <Row label="Index Number" value={profile.index_number} />}
        {profile.level && <Row label="Level" value={profile.level} />}
      </section>

      {/* Danger zone */}
      <section
        style={{
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #FECACA',
          background: '#FEF2F2',
        }}
      >
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#DC2626',
            marginBottom: '4px',
          }}
        >
          Delete Account
        </h2>
        <p style={{ fontSize: '13px', color: '#7F1D1D', marginBottom: '16px', lineHeight: 1.5 }}>
          {DELETE_WARNING}
        </p>
        <button
          id="open-delete-account"
          className="btn-danger"
          onClick={() => {
            setError(null)
            setIsOpen(true)
          }}
          style={{ minHeight: '40px', padding: '8px 18px', fontSize: '13px' }}
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
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
          {DELETE_WARNING}
        </p>

        {error && (
          <div
            role="alert"
            style={{
              fontSize: '13px',
              color: '#DC2626',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            style={{ minHeight: '40px' }}
          >
            Cancel
          </button>
          <button
            id="confirm-delete-account"
            type="button"
            className="btn-danger"
            onClick={handleConfirmDelete}
            disabled={isPending}
            style={{ minHeight: '40px', padding: '8px 18px' }}
          >
            {isPending ? 'Deleting…' : 'Yes, Delete My Account'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
