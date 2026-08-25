'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { createCourseNotification } from '@/lib/notifications'

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
    display: 'block', fontSize: '13px', fontWeight: '600',
    color: '#334155', marginBottom: '6px',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: '#FFFFFF',
    border: '1px solid #CBD5E1', borderRadius: '8px',
    color: '#0F172A', fontSize: '14px', fontFamily: 'inherit',
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

    // Send real notification to all enrolled students
    await createCourseNotification({
      courseId,
      title: 'New Assignment Posted',
      message: `Assignment '${title.trim()}' is now available. Max Score: ${maxScore} pts. Due: ${new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.`,
      type: 'assignment',
      link: `/student/courses/${courseId}?tab=assignments`,
    })

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
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
          />
        </div>

        <div>
          <label style={labelStyle}>Instructions (optional)</label>
          <textarea
            value={instructions} onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe the task, requirements, submission format…"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Deadline *</label>
            <input
              type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Max Score *</label>
            <input
              type="number" min={1} max={1000} value={maxScore}
              onChange={(e) => setMaxScore(Math.max(1, parseInt(e.target.value) || 100))}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: '8px',
            color: '#DC2626', fontSize: '13px',
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
          <button
            type="button" onClick={onClose}
            style={{
              padding: '9px 18px', background: '#F8FAFC',
              border: '1px solid #CBD5E1', borderRadius: '8px',
              color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Cancel</button>
          <button
            type="submit" disabled={loading}
            className="btn-primary"
            style={{
              padding: '9px 22px',
              fontSize: '14px',
            }}
          >
            {loading ? 'Creating…' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
