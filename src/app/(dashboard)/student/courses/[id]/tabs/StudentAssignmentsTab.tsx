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
    not_submitted: { label: 'Not Submitted', bg: '#F1F5F9', border: '#CBD5E1', color: '#64748B' },
    submitted:     { label: 'Submitted',     bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
    graded:        { label: 'Graded',        bg: '#ECFDF5', border: '#A7F3D0', color: '#059669' },
  }[status]
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
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
    <span style={{ fontSize: '12px', color: past ? '#DC2626' : '#64748B', fontWeight: past ? '600' : '400' }}>
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
          xhr.open('POST', uploadUrl)
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          xhr.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/submissions/${path}`
              resolve()
            } else {
              reject(new Error(`Upload failed (${xhr.status})`))
            }
          }
          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.send(file)
        })
      }

      setProgress(95)

      if (existing) {
        await supabase
          .from('submissions')
          .update({
            file_url: fileUrl,
            written_answer: answer.trim() || null,
            submitted_at: new Date().toISOString(),
          } as never)
          .eq('id', existing.id)
      } else {
        await supabase
          .from('submissions')
          .insert({
            assignment_id: assignment.id,
            student_id: userId,
            file_url: fileUrl,
            written_answer: answer.trim() || null,
          } as never)
      }

      setProgress(100)
      router.refresh()
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '14px' }}>
        {existing ? 'Your Submission' : 'Submit Assignment'}
      </h3>

      {isGraded && (
        <div style={{
          padding: '14px 16px', background: '#ECFDF5', border: '1px solid #A7F3D0',
          borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#065F46', margin: 0 }}>Graded Assignment</p>
            {existing?.feedback && (
              <p style={{ fontSize: '13px', color: '#047857', margin: '4px 0 0' }}>Feedback: {existing.feedback}</p>
            )}
          </div>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
            {existing?.grade} / {assignment.max_score}
          </span>
        </div>
      )}

      {/* Existing file link */}
      {existing?.file_url && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: '8px', marginBottom: '16px',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <a
            href={existing.file_url}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '13px', color: '#1D4ED8', fontWeight: '600', textDecoration: 'none' }}
          >
            Download Previously Submitted File ↗
          </a>
        </div>
      )}

      {canSubmit && (
        <>
          {/* File Picker */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Upload Submission File (PDF, DOCX, ZIP, Code)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '20px',
                textAlign: 'center', cursor: 'pointer', background: '#F8FAFC',
              }}
            >
              <input
                ref={fileRef}
                type="file"
                onChange={handleFilePick}
                style={{ display: 'none' }}
              />
              <p style={{ fontSize: '13px', fontWeight: '600', color: file ? '#1D4ED8' : '#0F172A', margin: 0 }}>
                {file ? `Selected: ${file.name}` : 'Click to select submission file'}
              </p>
            </div>
          </div>

          {/* Written text answer */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Written Answer / Notes (Optional)
            </label>
            <textarea
              className="form-input"
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write or paste your answer notes here..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {uploading && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#2563EB', transition: 'width 200ms ease' }} />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading}
            className="btn-primary"
            style={{ width: '100%', padding: '10px 20px', fontSize: '14px' }}
          >
            {uploading ? `Submitting (${progress}%)…` : existing ? 'Update Submission' : 'Turn In Assignment'}
          </button>
        </>
      )}
    </div>
  )
}

// ── List & Main view ─────────────────────────────────────────────────────────

interface StudentAssignmentsTabProps {
  assignments: Assignment[]
  submissions: Submission[]
  selectedAssignment?: Assignment
  courseId: string
  userId: string
}

export function StudentAssignmentsTab({
  assignments, submissions, selectedAssignment, courseId: _courseId, userId,
}: StudentAssignmentsTabProps) {
  const router = useRouter()
  const subMap = new Map(submissions.map((s) => [s.assignment_id, s]))

  if (selectedAssignment) {
    const existing = subMap.get(selectedAssignment.id)
    const status   = getStatus(selectedAssignment, existing)

    return (
      <div style={{ animation: 'tabFadeIn 200ms ease' }}>
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

        {/* Assignment header card */}
        <div style={{
          padding: '24px', background: '#FFFFFF',
          border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', lineHeight: 1.3 }}>
              {selectedAssignment.title}
            </h2>
            <StatusBadge status={status} />
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: selectedAssignment.instructions ? '14px' : '0' }}>
            <DeadlineText deadline={selectedAssignment.deadline} />
            <span style={{ fontSize: '12px', color: '#64748B' }}>· Max {selectedAssignment.max_score} pts</span>
          </div>
          {selectedAssignment.instructions && (
            <div style={{
              padding: '14px 16px', background: '#F8FAFC',
              border: '1px solid #E2E8F0', borderRadius: '8px',
              fontSize: '13px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap',
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

  if (assignments.length === 0) {
    return (
      <div style={{
        padding: '48px 30px', textAlign: 'center',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0', borderRadius: '12px',
        animation: 'tabFadeIn 200ms ease',
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
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Your lecturer hasn&apos;t posted any assignments yet.</p>
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
              background: '#FFFFFF',
              border: '1px solid #E2E8F0', borderRadius: '10px',
              cursor: 'pointer', transition: 'all 150ms ease',
              display: 'flex', alignItems: 'center', gap: '14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)' }}
          >
            <div style={{
              width: '38px', height: '38px', flexShrink: 0,
              background: status === 'graded' ? '#ECFDF5' : status === 'submitted' ? '#EFF6FF' : '#F1F5F9',
              border: `1px solid ${status === 'graded' ? '#A7F3D0' : status === 'submitted' ? '#BFDBFE' : '#CBD5E1'}`,
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={status === 'graded' ? '#059669' : status === 'submitted' ? '#1D4ED8' : '#64748B'}
                strokeWidth="2">
                {status === 'graded'
                  ? <path d="M20 6L9 17l-5-5"/>
                  : <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>
                }
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '3px' }}>{a.title}</p>
              <DeadlineText deadline={a.deadline} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <StatusBadge status={status} />
              {!past && status === 'not_submitted' && (
                <span style={{ fontSize: '13px', color: '#2563EB', fontWeight: '700' }}>Submit ➜</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
