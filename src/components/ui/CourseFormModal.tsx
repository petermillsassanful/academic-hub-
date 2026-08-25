'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from './Modal'
import type { Course } from '@/types/database'

interface CourseFormModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  courseToEdit?: Course | null
  course?: Course | null
}

const LEVELS = ['100', '200', '300', '400']
const SEMESTERS = ['Semester 1', 'Semester 2']

export function CourseFormModal({
  isOpen,
  onClose,
  userId,
  courseToEdit,
  course,
}: CourseFormModalProps) {
  const activeCourse = courseToEdit || course
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!activeCourse

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    level: '100',
    semester: 'Semester 1',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (activeCourse) {
      setForm({
        name: activeCourse.name,
        code: activeCourse.code,
        description: activeCourse.description ?? '',
        level: activeCourse.level,
        semester: activeCourse.semester,
      })
    } else {
      setForm({
        name: '',
        code: '',
        description: '',
        level: '100',
        semester: 'Semester 1',
      })
    }
    setError(null)
  }, [activeCourse, isOpen])

  function handleClose() {
    setError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (isEditing && courseToEdit) {
        const { error: updateError } = await supabase
          .from('courses')
          .update({
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            description: form.description.trim() || null,
            level: form.level,
            semester: form.semester,
          } as never)
          .eq('id', courseToEdit.id)

        if (updateError) throw updateError
        handleClose()
        router.refresh()
      } else {
        const insertPayload = {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || null,
          level: form.level,
          semester: form.semester,
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
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    color: '#0F172A',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 150ms ease',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
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
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
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
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
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
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
            >
              {LEVELS.map(l => (
                <option key={l} value={l}>Level {l}</option>
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
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
            >
              {SEMESTERS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description <span style={{ color: '#64748B' }}>(optional)</span></label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What will students learn in this course?"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#DC2626',
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            style={{
              padding: '9px 18px',
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !form.name.trim() || !form.code.trim()}
            className="btn-primary"
            style={{ padding: '9px 22px', fontSize: '13px', opacity: loading ? 0.7 : 1 }}
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
    </Modal>
  )
}
