'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Assignment, Submission } from '@/types/database'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(assignment: Assignment, sub?: Submission): 'not_submitted' | 'submitted' | 'graded' {
  if (!sub) return 'not_submitted'
  if (sub.grade !== null) return 'graded'
  return 'submitted'
}

function isPastDeadline(deadline: string) {
  return new Date(deadline).getTime() < Date.now()
}

function StatusBadge({ status }: { status: ReturnType<typeof getStatus> }) {
  const map = {
    not_submitted: { label: 'Not Submitted', bg: 'rgba(100,116,139,0.1)', border: '#334155', color: '#64748B' },
    submitted:     { label: 'Submitted',     bg: 'rgba(79,70,229,0.1)',   border: 'rgba(79,70,229,0.3)',   color: '#818CF8' },
    graded:        { label: 'Graded',        bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)', color: '#6EE7B7' },
  }[status]
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
      background: map.bg, border: `1px solid ${map.border}`, color: map.color,
    }}>
      {map.label}
    </span>
  )
}

function DeadlineText({ deadline }: { deadline: string }) {
  const past = isPastDeadline(deadline)
  const formatted = new Date(deadline).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  return (
    <span style={{ fontSize: '12px', color: past ? '#FCA5A5' : '#64748B' }}>
      {past ? '⏰ Past due · ' : '📅 Due '}{formatted}
    </span>
  )
}

// ── Submission form ───────────────────────────────────────────────────────────

interface SubmissionFormProps {
  assignment: Assignment
  userId: string
  existing?: Submission
  onSuccess: () => void
}

function SubmissionForm({ assignment, userId, existing, onSuccess }: SubmissionFormProps) {
  const supabase = createClient()
  const router = useRouter()

  const [file, setFile]               = useState<File | null>(null)
  const [answer, setAnswer]           = useState(existing?.written_answer ?? '')
  const [uploading, setUploading]     = useState(false)
  const [progress, setProgress]       = useState(0)
  const [error, setError]             = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const past      = isPastDeadline(assignment.deadline)
  const isGraded  = !!existing?.grade
  const canSubmit = !past && !isGraded

  const handleFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  async function handleSubmit() {
    if (!file && !answer.trim()) { setError('Please upload a file or write an answer.'); return }
    setError(null)
    setUploading(true)
    setProgress(0)

    try {
      let fileUrl: string | null = existing?.file_url ?? null

      // Upload file if selected
      if (file) {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) throw new Error('Not authenticated')

        const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path      = `${userId}/${assignment.id}/${Date.now()}-${safeName}`
        const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/submissions/${path}`

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) setProgress(Math.min(90, Math.round((e.loaded / e.total) * 90)))
          })
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) { setProgress(100); resolve() }
            else { try { reject(new Error(JSON.parse(xhr.responseText).message)) } catch { reject(new Error(`Upload failed (${xhr.status})`)) } }
          })
          xhr.addEventListener('error', () => reject(new Error('Network error')))
          xhr.open('POST', uploadUrl)
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          xhr.setRequestHeader('x-upsert', 'true')
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
          xhr.send(file)
        })

        fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/submissions/${path}`
      }

      const payload = {
        file_url:       fileUrl,
        written_answer: answer.trim() || null,
        submitted_at:   new Date().toISOString(),
      }

      let dbErr
      if (existing) {
        ;({ error: dbErr } = await supabase.from('submissions').update(payload as never).eq('id', existing.id))
      } else {
        ;({ error: dbErr } = await supabase.from('submissions').insert({
          ...payload,
          assignment_id: assignment.id,
          student_id: userId,
        } as never))
      }

      if (dbErr) throw dbErr
      router.refresh()
      onSuccess()
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Submission failed')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #334155', borderRadius: '9px',
    color: '#FFFFFF', fontSize: '14px', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms',
  }

  if (!canSubmit && !existing) {
    return (
      <div style={{
        padding: '20px', background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#FCA5A5' }}>⏰ Deadline has passed</p>
        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>This assignment is no longer accepting submissions.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Existing submission preview */}
      {existing && (
        <div style={{
          padding: '14px', background: 'rgba(79,70,229,0.06)',
          border: '1px solid rgba(79,70,229,0.2)', borderRadius: '10px',
        }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#818CF8', marginBottom: '8px' }}>
            Your previous submission
          </p>
          {existing.file_url && (
            <a href={existing.file_url} target="_blank" rel="noreferrer"
              style={{ fontSize: '13px', color: '#818CF8', display: 'block', marginBottom: '4px' }}>
              📎 View submitted file
            </a>
          )}
          {existing.written_answer && (
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {existing.written_answer.slice(0, 200)}{existing.written_answer.length > 200 ? '…' : ''}
            </p>
          )}
        </div>
      )}

      {canSubmit && (
        <>
          {/* File upload */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: '500', color: '#94A3B8', marginBottom: '8px' }}>
              Attach a file (optional)
            </p>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                padding: '14px 16px',
                border: `1px dashed ${file ? '#4F46E5' : '#334155'}`,
                borderRadius: '10px',
                background: file ? 'rgba(79,70,229,0.06)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer', transition: 'all 150ms',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
              onMouseLeave={(e) => { if (!file) e.currentTarget.style.borderColor = '#334155' }}
            >
              <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFilePick} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={file ? '#818CF8' : '#475569'} strokeWidth="1.8">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span style={{ fontSize: '13px', color: file ? '#FFFFFF' : '#64748B' }}>
                {file ? file.name : 'Click to choose a file'}
              </span>
              {file && (
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '18px' }}
                >×</button>
              )}
            </div>
          </div>

          {/* Written answer */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: '500', color: '#94A3B8', marginBottom: '8px' }}>
              Written answer (optional)
            </p>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here…"
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#334155' }}
            />
          </div>

          {/* Progress bar */}
          {uploading && file && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Uploading…</span>
                <span style={{ fontSize: '12px', color: '#818CF8', fontWeight: '600' }}>{progress}%</span>
              </div>
              <div style={{ height: '5px', background: '#1E293B', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#4F46E5,#818CF8)', borderRadius: '99px', transition: 'width 200ms' }} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '9px', color: '#FCA5A5', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={uploading}
            style={{
              padding: '11px 24px',
              background: uploading ? 'rgba(79,70,229,0.5)' : '#4F46E5',
              border: 'none', borderRadius: '9px', color: '#FFFFFF',
              fontSize: '14px', fontWeight: '700', cursor: uploading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', alignSelf: 'flex-start',
            }}
          >
            {uploading ? 'Submitting…' : existing ? '↻ Re-submit' : '→ Submit'}
          </button>
        </>
      )}

      {/* If graded, show result */}
      {isGraded && (
        <div style={{
          padding: '16px', background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px',
        }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#6EE7B7', marginBottom: '6px' }}>✓ Graded</p>
          <p style={{ fontSize: '22px', fontWeight: '800', color: '#FFFFFF' }}>
            {existing!.grade} <span style={{ fontSize: '14px', color: '#475569', fontWeight: '400' }}>/ {assignment.max_score}</span>
          </p>
          {existing!.feedback && (
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '8px', lineHeight: 1.7 }}>{existing!.feedback}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface StudentAssignmentsTabProps {
  assignments: Assignment[]
  submissions: Submission[]            // student's own
  selectedAssignment?: Assignment
  courseId: string
  userId: string
}

export function StudentAssignmentsTab({
  assignments, submissions, selectedAssignment, courseId: _courseId, userId,
}: StudentAssignmentsTabProps) {
  const router = useRouter()
  const subMap = new Map(submissions.map((s) => [s.assignment_id, s]))

  // ── Detail view ───────────────────────────────────────────────────────────────
  if (selectedAssignment) {
    const existing = subMap.get(selectedAssignment.id)
    const status   = getStatus(selectedAssignment, existing)

    return (
      <div style={{ animation: 'tabFadeIn 200ms ease' }}>
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

        {/* Assignment header */}
        <div style={{
          padding: '20px 24px', background: 'rgba(255,255,255,0.02)',
          border: '1px solid #1E293B', borderRadius: '12px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.3 }}>
              {selectedAssignment.title}
            </h2>
            <StatusBadge status={status} />
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: selectedAssignment.instructions ? '12px' : '0' }}>
            <DeadlineText deadline={selectedAssignment.deadline} />
            <span style={{ fontSize: '12px', color: '#475569' }}>· Max {selectedAssignment.max_score} pts</span>
          </div>
          {selectedAssignment.instructions && (
            <div style={{
              padding: '12px', background: 'rgba(255,255,255,0.02)',
              border: '1px solid #1E293B', borderRadius: '8px',
              fontSize: '13px', color: '#94A3B8', lineHeight: 1.7, whiteSpace: 'pre-wrap',
            }}>
              {selectedAssignment.instructions}
            </div>
          )}
        </div>

        {/* Submission form */}
        <SubmissionForm
          assignment={selectedAssignment}
          userId={userId}
          existing={existing}
          onSuccess={() => router.push('?tab=assignments')}
        />
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  if (assignments.length === 0) {
    return (
      <div style={{
        padding: '50px 30px', textAlign: 'center',
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed #1E293B', borderRadius: '12px',
        animation: 'tabFadeIn 200ms ease',
      }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '6px' }}>No assignments yet</p>
        <p style={{ fontSize: '13px', color: '#475569' }}>Your lecturer hasn&apos;t posted any assignments yet.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'tabFadeIn 200ms ease' }}>
      {assignments.map((a) => {
        const sub    = subMap.get(a.id)
        const status = getStatus(a, sub)
        const past   = isPastDeadline(a.deadline)

        return (
          <div
            key={a.id}
            onClick={() => router.push(`?tab=assignments&assignment=${a.id}`)}
            style={{
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid #1E293B', borderRadius: '12px',
              cursor: 'pointer', transition: 'border-color 150ms',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1E293B' }}
          >
            <div style={{
              width: '36px', height: '36px', flexShrink: 0,
              background: status === 'graded' ? 'rgba(16,185,129,0.1)' : status === 'submitted' ? 'rgba(79,70,229,0.1)' : 'rgba(100,116,139,0.1)',
              border: `1px solid ${status === 'graded' ? 'rgba(16,185,129,0.25)' : status === 'submitted' ? 'rgba(79,70,229,0.25)' : '#334155'}`,
              borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={status === 'graded' ? '#6EE7B7' : status === 'submitted' ? '#818CF8' : '#64748B'}
                strokeWidth="1.8">
                {status === 'graded'
                  ? <path d="M20 6L9 17l-5-5"/>
                  : <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>
                }
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '5px' }}>{a.title}</p>
              <DeadlineText deadline={a.deadline} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <StatusBadge status={status} />
              {!past && status === 'not_submitted' && (
                <span style={{ fontSize: '12px', color: '#4F46E5', fontWeight: '600' }}>Submit →</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
