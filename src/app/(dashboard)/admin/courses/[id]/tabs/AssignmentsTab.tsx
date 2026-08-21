'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Assignment } from '@/types/database'
import { AssignmentFormModal } from './AssignmentFormModal'
import { GradingPanel, type SubmissionWithProfile } from './GradingPanel'

// ── Helpers ──────────────────────────────────────────────────────────────────

function deadlineStatus(dl: string): 'upcoming' | 'soon' | 'past' {
  const diff = new Date(dl).getTime() - Date.now()
  if (diff < 0) return 'past'
  if (diff < 3 * 24 * 60 * 60 * 1000) return 'soon'
  return 'upcoming'
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const status = deadlineStatus(deadline)
  const formatted = new Date(deadline).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const colors = {
    past:     { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   text: '#FCA5A5' },
    soon:     { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  text: '#FCD34D' },
    upcoming: { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', text: '#94A3B8' },
  }[status]

  return (
    <span style={{
      padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: '600',
      background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text,
      whiteSpace: 'nowrap',
    }}>
      {status === 'past' ? '⏰ Past due · ' : status === 'soon' ? '⚡ Due soon · ' : '📅 '}{formatted}
    </span>
  )
}

// ── AssignmentWithCount ───────────────────────────────────────────────────────

export interface AssignmentWithCount extends Assignment {
  submissionCount: number
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AssignmentsTabProps {
  courseId: string
  assignments: AssignmentWithCount[]
  selectedAssignment?: Assignment
  submissions?: SubmissionWithProfile[]
}

// ── Main component ────────────────────────────────────────────────────────────

export function AssignmentsTab({ courseId, assignments, selectedAssignment, submissions }: AssignmentsTabProps) {
  const router = useRouter()
  // useRef so createClient() is called exactly once — not on every render
  const supabaseRef = useRef(createClient())
  const [formOpen, setFormOpen]       = useState(false)
  const [gradingItem, setGradingItem] = useState<SubmissionWithProfile | null>(null)
  const [localSubs, setLocalSubs]     = useState<SubmissionWithProfile[]>(submissions ?? [])

  // Optimistic save: update local state immediately, persist in background
  async function handleSaveGrade(grade: number, feedback: string | null) {
    if (!gradingItem) return
    const now = new Date().toISOString()
    // 1. Optimistic update — grade appears instantly in the table
    const savedId = gradingItem.id
    setLocalSubs((prev) =>
      prev.map((s) =>
        s.id === savedId
          ? { ...s, grade, feedback: feedback ?? null, graded_at: now }
          : s
      )
    )
    setGradingItem(null)
    // 2. Background persist
    await supabaseRef.current
      .from('submissions')
      .update({ grade, feedback, graded_at: now } as never)
      .eq('id', savedId)
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selectedAssignment) {
    return (
      <div style={{ animation: 'tabFadeIn 200ms ease' }}>
        {/* Back + header */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => router.push('?tab=assignments')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'transparent', border: 'none', color: '#64748B',
              fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: '16px', padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#94A3B8' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to assignments
          </button>

          <div style={{
            padding: '20px 24px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid #1E293B',
            borderRadius: '12px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', marginBottom: '8px' }}>
              {selectedAssignment.title}
            </h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <DeadlineBadge deadline={selectedAssignment.deadline} />
              <span style={{ fontSize: '12px', color: '#475569' }}>Max {selectedAssignment.max_score} pts</span>
            </div>
            {selectedAssignment.instructions && (
              <p style={{
                fontSize: '13px', color: '#64748B', lineHeight: 1.7,
                marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1E293B', borderRadius: '8px',
                whiteSpace: 'pre-wrap',
              }}>
                {selectedAssignment.instructions}
              </p>
            )}
          </div>
        </div>

        {/* Submissions table */}
        <div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
            Submissions ({localSubs.length})
          </p>

          {localSubs.length === 0 ? (
            <div style={{
              padding: '40px', textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed #1E293B', borderRadius: '12px',
            }}>
              <p style={{ fontSize: '14px', color: '#475569' }}>No submissions yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid #1E293B', borderRadius: '12px', overflow: 'hidden',
              minWidth: '540px',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 80px 80px 120px',
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid #1E293B',
              }}>
                {['Student', 'Submitted At', 'Type', 'Grade', 'Action'].map((h) => (
                  <span key={h} style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>

              {localSubs.map((s) => {
                const name = s.profiles.full_name ?? s.profiles.email
                const type = s.file_url ? (s.written_answer ? 'File + Text' : 'File') : 'Text'
                const graded = s.grade !== null

                return (
                  <div
                    key={s.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 140px 80px 80px 120px',
                      padding: '12px 16px',
                      borderBottom: '1px solid #1E293B',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', margin: 0 }}>{name}</p>
                      <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{s.profiles.email}</p>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      {new Date(s.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>{type}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: graded ? '#6EE7B7' : '#475569' }}>
                      {graded ? `${s.grade}/${selectedAssignment.max_score}` : '—'}
                    </span>
                    <button
                      onClick={() => setGradingItem(s)}
                      style={{
                        padding: '6px 14px',
                        background: graded ? 'rgba(16,185,129,0.08)' : 'rgba(79,70,229,0.1)',
                        border: `1px solid ${graded ? 'rgba(16,185,129,0.25)' : 'rgba(79,70,229,0.25)'}`,
                        borderRadius: '7px',
                        color: graded ? '#6EE7B7' : '#818CF8',
                        fontSize: '12px', fontWeight: '600',
                        cursor: 'pointer', fontFamily: 'inherit',
                        width: 'fit-content',
                      }}
                    >
                      {graded ? 'Edit Grade' : 'Grade'}
                    </button>
                  </div>
                )
              })}
            </div>
            </div>
          )}
        </div>

        {/* Grading panel */}
        {gradingItem && (
          <GradingPanel
            submission={gradingItem}
            assignment={selectedAssignment}
            onClose={() => setGradingItem(null)}
            onSave={handleSaveGrade}
          />
        )}
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ animation: 'tabFadeIn 200ms ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF' }}>
          Assignments <span style={{ fontWeight: '400', color: '#475569', fontSize: '14px' }}>({assignments.length})</span>
        </h2>
        <button
          onClick={() => setFormOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 18px',
            minHeight: '44px',
            background: '#4F46E5', border: 'none', borderRadius: '9px',
            color: '#FFFFFF', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div style={{
          padding: '50px 30px', textAlign: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed #1E293B', borderRadius: '12px',
        }}>
          <div style={{
            width: '48px', height: '48px', margin: '0 auto 14px',
            background: 'rgba(79,70,229,0.08)', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '6px' }}>No assignments yet</p>
          <p style={{ fontSize: '13px', color: '#475569' }}>Click &quot;New Assignment&quot; to create your first.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {assignments.map((a) => (
            <div
              key={a.id}
              onClick={() => router.push(`?tab=assignments&assignment=${a.id}`)}
              style={{
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1E293B',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'border-color 150ms',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1E293B' }}
            >
              <div style={{
                width: '40px', height: '40px', flexShrink: 0,
                background: 'rgba(79,70,229,0.1)',
                border: '1px solid rgba(79,70,229,0.2)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="1.8">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', marginBottom: '6px' }}>{a.title}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <DeadlineBadge deadline={a.deadline} />
                  <span style={{ fontSize: '11px', color: '#475569' }}>Max {a.max_score} pts</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF' }}>{a.submissionCount}</p>
                <p style={{ fontSize: '11px', color: '#475569' }}>submitted</p>
              </div>

              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <AssignmentFormModal courseId={courseId} onClose={() => setFormOpen(false)} />
      )}
    </div>
  )
}
