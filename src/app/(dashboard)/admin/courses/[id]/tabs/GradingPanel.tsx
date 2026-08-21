'use client'

import { useState } from 'react'
import type { Assignment, Submission } from '@/types/database'

interface Profile { full_name: string | null; email: string }
export interface SubmissionWithProfile extends Submission {
  profiles: Profile
}

interface GradingPanelProps {
  submission: SubmissionWithProfile
  assignment: Assignment
  onClose: () => void
  /**
   * Hand the validated grade up to the parent, which patches the row
   * optimistically, closes this panel instantly, and persists in the
   * background (item 8). The panel itself no longer touches the DB, so the
   * save feels instant instead of waiting on a network round-trip + refresh.
   */
  onSave: (grade: number, feedback: string | null) => void
}

export function GradingPanel({ submission, assignment, onClose, onSave }: GradingPanelProps) {
  const [grade, setGrade]       = useState<string>(submission.grade?.toString() ?? '')
  const [feedback, setFeedback] = useState(submission.feedback ?? '')
  const [error, setError]       = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)

  const studentName = submission.profiles.full_name ?? submission.profiles.email

  function handleSave() {
    const numGrade = parseFloat(grade)
    if (isNaN(numGrade) || numGrade < 0 || numGrade > assignment.max_score) {
      setError(`Grade must be between 0 and ${assignment.max_score}`)
      return
    }
    setError(null)
    setSaving(true)
    // onSave is synchronous (parent does optimistic update + background persist);
    // we reset saving after a short delay so the button flash is visible.
    onSave(numGrade, feedback.trim() || null)
    setTimeout(() => setSaving(false), 600)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #334155', borderRadius: '9px',
    color: '#FFFFFF', fontSize: '14px', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms',
  }

  return (
    /* Overlay */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      {/* Slide-over panel */}
      <div
        style={{
          width: '480px', maxWidth: '95vw',
          height: '100vh', overflowY: 'auto',
          background: '#0D1526',
          borderLeft: '1px solid #1E293B',
          padding: '32px 28px',
          display: 'flex', flexDirection: 'column', gap: '20px',
          animation: 'slideIn 200ms ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Grading Submission
            </p>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.3 }}>
              {studentName}
            </h2>
            <p style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
              {assignment.title} · Max {assignment.max_score} pts
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid #1E293B',
              borderRadius: '8px', color: '#64748B', cursor: 'pointer',
              width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ height: '1px', background: '#1E293B' }} />

        {/* Submitted content */}
        <div>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
            Submission
          </p>

          {submission.file_url && (
            <a
              href={submission.file_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 14px',
                background: 'rgba(79,70,229,0.06)',
                border: '1px solid rgba(79,70,229,0.2)',
                borderRadius: '9px',
                color: '#818CF8', fontSize: '13px', fontWeight: '500',
                textDecoration: 'none', marginBottom: '10px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download submitted file
            </a>
          )}

          {submission.written_answer && (
            <div style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid #1E293B',
              borderRadius: '9px',
              fontSize: '13px', color: '#94A3B8', lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              maxHeight: '200px', overflowY: 'auto',
            }}>
              {submission.written_answer}
            </div>
          )}

          {!submission.file_url && !submission.written_answer && (
            <p style={{ fontSize: '13px', color: '#475569' }}>No content submitted.</p>
          )}

          <p style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>
            Submitted {new Date(submission.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div style={{ height: '1px', background: '#1E293B' }} />

        {/* Grade input */}
        <div>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
            Grade
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="number" min={0} max={assignment.max_score} step={0.5}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="0"
              style={{ ...inputStyle, width: '120px' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#334155' }}
            />
            <span style={{ fontSize: '14px', color: '#475569' }}>/ {assignment.max_score}</span>
            {grade && !isNaN(parseFloat(grade)) && (
              <span style={{
                padding: '4px 10px',
                background: 'rgba(79,70,229,0.1)',
                border: '1px solid rgba(79,70,229,0.2)',
                borderRadius: '99px',
                fontSize: '12px', fontWeight: '700', color: '#818CF8',
              }}>
                {Math.round((parseFloat(grade) / assignment.max_score) * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Feedback */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
            Feedback (optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write feedback for the student…"
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#334155' }}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '9px',
            color: '#FCA5A5', fontSize: '13px',
          }}>{error}</div>
        )}

        {/* Save */}
        <button
          onClick={handleSave} disabled={saving}
          style={{
            padding: '12px 24px',
            background: saving ? 'rgba(79,70,229,0.5)' : '#4F46E5',
            border: 'none', borderRadius: '10px', color: '#FFFFFF',
            fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', marginTop: 'auto',
          }}
        >
          {saving ? 'Saving…' : '✓ Save Grade'}
        </button>
      </div>

      <style>{`@keyframes slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }`}</style>
    </div>
  )
}
