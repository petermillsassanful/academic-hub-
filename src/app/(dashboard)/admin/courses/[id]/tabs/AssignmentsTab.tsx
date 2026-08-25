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
    past:     { bg: '#FEE2E2', border: '#FECACA', text: '#DC2626' },
    soon:     { bg: '#FEF3C7', border: '#FDE68A', text: '#D97706' },
    upcoming: { bg: '#F1F5F9', border: '#CBD5E1', text: '#475569' },
  }[status]

  return (
    <span style={{
      padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
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
  const supabaseRef = useRef(createClient())
  const [formOpen, setFormOpen]       = useState(false)
  const [gradingItem, setGradingItem] = useState<SubmissionWithProfile | null>(null)
  const [localSubs, setLocalSubs]     = useState<SubmissionWithProfile[]>(submissions ?? [])

  async function handleSaveGrade(grade: number, feedback: string | null) {
    if (!gradingItem) return
    const now = new Date().toISOString()
    const savedId = gradingItem.id
    setLocalSubs((prev) =>
      prev.map((s) =>
        s.id === savedId
          ? { ...s, grade, feedback: feedback ?? null, graded_at: now }
          : s
      )
    )
    setGradingItem(null)
    await supabaseRef.current
      .from('submissions')
      .update({ grade, feedback, graded_at: now } as never)
      .eq('id', savedId)

    const targetSub = localSubs.find((s) => s.id === savedId)
    if (targetSub && selectedAssignment) {
      await supabaseRef.current.from('notifications').insert({
        user_id: targetSub.student_id,
        course_id: selectedAssignment.course_id,
        title: 'Assignment Graded',
        message: `Your submission for '${selectedAssignment.title}' was marked: ${grade}/${selectedAssignment.max_score} pts.`,
        type: 'grade',
        link: `/student/courses/${selectedAssignment.course_id}?tab=grades`,
        is_read: false,
      } as never)
    }
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
              background: 'transparent', border: 'none', color: '#1B2559',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: '16px', padding: 0,
            }}
          >
            ← Back to Assignments
          </button>

          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                  {selectedAssignment.title}
                </h1>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <DeadlineBadge deadline={selectedAssignment.deadline} />
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                    Max Score: {selectedAssignment.max_score} pts
                  </span>
                </div>
              </div>
            </div>

            {selectedAssignment.instructions && (
              <div style={{
                fontSize: '14px', color: '#334155', lineHeight: 1.6,
                padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0',
              }}>
                {selectedAssignment.instructions}
              </div>
            )}
          </div>

          {/* Submissions Section */}
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '14px' }}>
            Student Submissions ({localSubs.length})
          </h2>

          {localSubs.length === 0 ? (
            <div style={{
              padding: '40px 24px', textAlign: 'center', background: '#FFFFFF',
              border: '1px solid #E2E8F0', borderRadius: '12px',
            }}>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>No submissions received yet.</p>
            </div>
          ) : (
            <div style={{
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {localSubs.map((sub) => {
                  const graded = sub.grade !== null && sub.grade !== undefined
                  return (
                    <div
                      key={sub.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px', borderBottom: '1px solid #F1F5F9', gap: '16px',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: 0, marginBottom: '3px' }}>
                          {sub.profiles?.full_name ?? 'Unknown Student'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                          {sub.profiles?.index_number ? `Index: ${sub.profiles.index_number} · ` : ''}
                          Submitted {new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {graded ? (
                          <span style={{
                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                            background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669',
                          }}>
                            {sub.grade} / {selectedAssignment.max_score} pts
                          </span>
                        ) : (
                          <span style={{
                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                            background: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706',
                          }}>
                            Ungraded
                          </span>
                        )}

                        <button
                          onClick={() => setGradingItem(sub)}
                          style={{
                            padding: '6px 14px',
                            background: '#1B2559',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#FFFFFF',
                            fontSize: '12px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {graded ? 'Edit Grade' : 'Grade'}
                        </button>
                      </div>
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
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>
          Course Assignments <span style={{ fontWeight: '500', color: '#64748B', fontSize: '14px' }}>({assignments.length})</span>
        </h2>
        <button
          onClick={() => setFormOpen(true)}
          className="btn-primary"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 18px',
            minHeight: '40px',
            fontSize: '13px', fontWeight: '600',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          + New Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div style={{
          padding: '48px 30px', textAlign: 'center',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0', borderRadius: '12px',
        }}>
          <div style={{
            width: '48px', height: '48px', margin: '0 auto 12px',
            background: '#EFF6FF', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>No assignments yet</p>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Click &quot;+ New Assignment&quot; to publish your first exercise or coursework.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {assignments.map((a) => (
            <div
              key={a.id}
              onClick={() => router.push(`?tab=assignments&assignment=${a.id}`)}
              style={{
                padding: '16px 20px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                display: 'flex', alignItems: 'center', gap: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)' }}
            >
              <div style={{
                width: '40px', height: '40px', flexShrink: 0,
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>{a.title}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <DeadlineBadge deadline={a.deadline} />
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Max {a.max_score} pts</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{a.submissionCount}</p>
                <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>submitted</p>
              </div>

              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
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
