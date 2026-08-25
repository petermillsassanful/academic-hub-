'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  courseName: string
  courseCode: string
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  courseId,
  courseName,
  courseCode,
}: DeleteConfirmDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setError(null)
    setLoading(false)
    onClose()
  }

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (deleteError) throw deleteError

      router.push('/admin')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete course'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Delete Course" maxWidth={460}>
      {/* Warning icon */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          width: '52px',
          height: '52px',
          margin: '0 auto 16px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>

        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
          This will permanently delete{' '}
          <strong style={{ color: '#0F172A' }}>{courseName}</strong>
          {' '}and all its content. This cannot be undone.
        </p>

        <div style={{
          display: 'inline-block',
          marginTop: '12px',
          padding: '4px 10px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '700',
          color: '#DC2626',
          letterSpacing: '0.05em',
        }}>
          {courseCode}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 14px',
          marginBottom: '16px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#FCA5A5',
        }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleClose}
          disabled={loading}
          className="btn-ghost"
          style={{ flex: 1, padding: '11px', fontSize: '14px' }}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="btn-danger"
          style={{
            flex: 1,
            padding: '11px',
            fontSize: '14px',
            background: loading ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '10px',
            color: '#FCA5A5',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(239,68,68,0.25)'
              e.currentTarget.style.color = '#FFFFFF'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
              e.currentTarget.style.color = '#FCA5A5'
            }
          }}
        >
          {loading ? 'Deleting…' : 'Delete Course'}
        </button>
      </div>
    </Modal>
  )
}
