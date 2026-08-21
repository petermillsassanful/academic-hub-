'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'

interface AssignmentFormModalProps {
  courseId: string
  onClose: () => void
}

export function AssignmentFormModal({ courseId, onClose }: AssignmentFormModalProps) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle]               = useState('')
  const [instructions, setInstructions] = useState('')
  const [deadline, setDeadline]         = useState('')
  const [maxScore, setMaxScore]         = useState<number>(100)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: '500',
    color: '#94A3B8', marginBottom: '6px',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #334155', borderRadius: '9px',
    color: '#FFFFFF', fontSize: '14px', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    if (!deadline)     { setError('Deadline is required'); return }
    setError(null)
    setLoading(true)

    const { error: dbErr } = await supabase.from('assignments').insert({
      course_id: courseId,
      title: title.trim(),
      instructions: instructions.trim() || null,
      deadline: new Date(deadline).toISOString(),
      max_score: maxScore,
    } as never)

    setLoading(false)
    if (dbErr) { setError(dbErr.message); return }
    router.refresh()
    onClose()
  }

  return (
    <Modal isOpen onClose={onClose} title="New Assignment">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div>
          <label style={labelStyle}>Title *</label>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Week 1 Lab Report" style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#334155' }}
          />
        </div>

        <div>
          <label style={labelStyle}>Instructions (optional)</label>
          <textarea
            value={instructions} onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe the task, requirements, submission format…"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#334155' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Deadline *</label>
            <input
              type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#334155' }}
            />
          </div>
          <div style={{ width: '120px' }}>
            <label style={labelStyle}>Max Score *</label>
            <input
              type="number" min={1} max={1000} value={maxScore}
              onChange={(e) => setMaxScore(Math.max(1, parseInt(e.target.value) || 100))}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#334155' }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '9px',
            color: '#FCA5A5', fontSize: '13px',
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
          <button
            type="button" onClick={onClose}
            style={{
              padding: '9px 18px', background: 'transparent',
              border: '1px solid #334155', borderRadius: '9px',
              color: '#64748B', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Cancel</button>
          <button
            type="submit" disabled={loading}
            style={{
              padding: '9px 22px',
              background: loading ? 'rgba(79,70,229,0.5)' : '#4F46E5',
              border: 'none', borderRadius: '9px', color: '#FFFFFF',
              fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Creating…' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
