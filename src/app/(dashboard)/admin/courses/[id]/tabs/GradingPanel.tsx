'use client'

import { useState } from 'react'
import type { Assignment, Submission } from '@/types/database'

interface Profile { full_name: string | null; email: string; index_number?: string | null }
export interface SubmissionWithProfile extends Submission {
  profiles: Profile
}

interface GradingPanelProps {
  submission: SubmissionWithProfile
  assignment: Assignment
  onClose: () => void
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
    onSave(numGrade, feedback.trim() || null)
    setTimeout(() => setSaving(false), 600)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: '#FFFFFF',
    border: '1px solid #CBD5E1', borderRadius: '8px',
    color: '#0F172A', fontSize: '14px', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms',
  }

  return (
    /* Overlay */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      {/* Slide-over panel */}
      <div
        style={{
          width: '480px', maxWidth: '95vw',
          height: '100vh', overflowY: 'auto',
          background: '#FFFFFF',
          borderLeft: '1px solid #E2E8F0',
          padding: '32px 28px',
          display: 'flex', flexDirection: 'column', gap: '20px',
          animation: 'slideIn 200ms ease',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Grading Submission
            </p>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', lineHeight: 1.3, margin: 0 }}>
              {studentName}
            </h2>
            <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
              {assignment.title} · Max {assignment.max_score} pts
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F8FAFC', border: '1px solid #CBD5E1',
              borderRadius: '8px', color: '#64748B', cursor: 'pointer',
              width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ height: '1px', background: '#E2E8F0' }} />

        {/* Submitted content */}
        <div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
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
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                color: '#1D4ED8', fontSize: '13px', fontWeight: '600',
                textDecoration: 'none', marginBottom: '10px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Download submitted file
            </a>
          )}

          {submission.written_answer && (
            <div style={{
              padding: '12px 14px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '13px', color: '#334155', lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              maxHeight: '200px', overflowY: 'auto',
            }}>
              {submission.written_answer}
            </div>
          )}

          {!submission.file_url && !submission.written_answer && (
            <p style={{ fontSize: '13px', color: '#64748B' }}>No content submitted.</p>
          )}

          <p style={{ fontSize: '11px', color: '#64748B', marginTop: '8px' }}>
            Submitted {new Date(submission.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div style={{ height: '1px', background: '#E2E8F0' }} />

        {/* Grade input */}
        <div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
            Grade
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="number" min={0} max={assignment.max_score} step={0.5}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="0"
              style={{ ...inputStyle, width: '120px' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
            />
            <span style={{ fontSize: '14px', color: '#475569', fontWeight: '600' }}>/ {assignment.max_score}</span>
            {grade && !isNaN(parseFloat(grade)) && (
              <span style={{
                padding: '4px 10px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '99px',
                fontSize: '12px', fontWeight: '700', color: '#059669',
              }}>
                {Math.round((parseFloat(grade) / assignment.max_score) * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Feedback */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
            Feedback (optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write feedback for the student…"
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: '8px',
            color: '#DC2626', fontSize: '13px',
          }}>{error}</div>
        )}

        {/* Save */}
        <button
          onClick={handleSave} disabled={saving}
          className="btn-primary"
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            marginTop: 'auto',
          }}
        >
          {saving ? 'Saving…' : '✓ Save Grade'}
        </button>
      </div>

      <style>{`@keyframes slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }`}</style>
    </div>
  )
}
