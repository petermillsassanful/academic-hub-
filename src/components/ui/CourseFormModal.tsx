'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import type { Course, Database } from '@/types/database'

type CourseUpdate = Database['public']['Tables']['courses']['Update']
type CourseInsert = Database['public']['Tables']['courses']['Insert']

interface CourseFormModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  course?: Course
}

const LEVELS = ['100', '200', '300', '400', '500', '600']
const SEMESTERS = ['Semester 1', 'Semester 2']

function parseLevelFromSemester(semester: string): string {
  const match = semester.match(/Level (\d+)/)
  return match ? match[1] : '100'
}

function parseSemesterFromSemester(semester: string): string {
  if (semester.includes('Semester 2')) return 'Semester 2'
  return 'Semester 1'
}

export function CourseFormModal({ isOpen, onClose, userId, course }: CourseFormModalProps) {
  const router = useRouter()
  const isEditing = !!course

  const [form, setForm] = useState({
    name: course?.name ?? '',
    code: course?.code ?? '',
    description: course?.description ?? '',
    level: course ? (course.level || parseLevelFromSemester(course.semester)) : LEVELS[0],
    semester: course ? parseSemesterFromSemester(course.semester) : SEMESTERS[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setError(null)
    setLoading(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const semesterDisplay = `Level ${form.level} — ${form.semester}`

    try {
      if (isEditing) {
        const updatePayload: CourseUpdate = {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || null,
          level: form.level,
          semester: semesterDisplay,
        }
        const { error: updateError } = await supabase
          .from('courses')
          .update(updatePayload as never)
          .eq('id', course.id)
          .eq('created_by', userId)

        if (updateError) throw updateError
        router.refresh()
        handleClose()
      } else {
        const insertPayload: CourseInsert = {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || null,
          level: form.level,
          semester: semesterDisplay,
          created_by: userId,
        }
        const { data, error: insertError } = await supabase
          .from('courses')
          .insert(insertPayload as never)
          .select('id')
          .single<{ id: string }>()

        if (insertError) throw insertError
        handleClose()
        router.push(`/admin/courses/${data.id}`)
        router.refresh()
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        (err instanceof Error ? err.message : 'Something went wrong')
      setError(msg)
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#FFFFFF',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 150ms ease',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: '6px',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Course' : 'Create New Course'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Course Name */}
        <div>
          <label style={labelStyle}>Course Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Introduction to Computer Science"
            required
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#334155' }}
          />
        </div>

        {/* Course Code */}
        <div>
          <label style={labelStyle}>Course Code *</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
            placeholder="e.g. CS101"
            required
            style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#334155' }}
          />
        </div>

        {/* Level + Semester side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Level *</label>
            <select
              value={form.level}
              onChange={(e) => setForm(f => ({ ...f, level: e.target.value }))}
              required
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#334155' }}
            >
              {LEVELS.map(l => (
                <option key={l} value={l} style={{ background: '#0A0F1E' }}>Level {l}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Semester *</label>
            <select
              value={form.semester}
              onChange={(e) => setForm(f => ({ ...f, semester: e.target.value }))}
              required
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#334155' }}
            >
              {SEMESTERS.map(s => (
                <option key={s} value={s} style={{ background: '#0A0F1E' }}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description <span style={{ color: '#475569' }}>(optional)</span></label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What will students learn in this course?"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#334155' }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px',
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
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="btn-ghost"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !form.name.trim() || !form.code.trim()}
            className="btn-primary"
            style={{ padding: '10px 24px', fontSize: '14px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Saving…
              </span>
            ) : isEditing ? 'Save Changes' : 'Create Course'}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #0A0F1E; color: #FFFFFF; }
      `}</style>
    </Modal>
  )
}
