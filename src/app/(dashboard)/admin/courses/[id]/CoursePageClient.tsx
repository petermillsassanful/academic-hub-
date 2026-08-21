'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CourseFormModal } from '@/components/ui/CourseFormModal'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import type { Course } from '@/types/database'

interface CoursePageClientProps {
  course: Course
  userId: string
  studentCount: number
}

export function CoursePageClient({ course, userId, studentCount }: CoursePageClientProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      {/* Back link */}
      <Link
        href="/admin"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: '#64748B',
          textDecoration: 'none',
          marginBottom: '20px',
          transition: 'color 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#94A3B8' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to Dashboard
      </Link>

      {/* Course Header Card */}
      <div className="glass-card" style={{ padding: '28px 32px', marginBottom: '28px' }}>
        {/* Top row: badge + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }} className="mobile-stack-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 11px',
              background: 'rgba(79,70,229,0.12)',
              border: '1px solid rgba(79,70,229,0.3)',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#818CF8',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}>
              {course.code}
            </span>
            <span style={{
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid #1E293B',
              borderRadius: '7px',
              fontSize: '12px',
              color: '#64748B',
              fontWeight: '500',
            }}>
              {course.semester}
            </span>
            <span style={{
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid #1E293B',
              borderRadius: '7px',
              fontSize: '12px',
              color: '#64748B',
              fontWeight: '500',
            }}>
              {studentCount} student{studentCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }} className="course-action-row">
            {/* Edit */}
            <button
              id="edit-course-btn"
              onClick={() => setEditOpen(true)}
              title="Edit course details"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                minHeight: '44px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid #334155',
                borderRadius: '9px',
                color: '#94A3B8',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(79,70,229,0.1)'
                e.currentTarget.style.borderColor = 'rgba(79,70,229,0.3)'
                e.currentTarget.style.color = '#FFFFFF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = '#334155'
                e.currentTarget.style.color = '#94A3B8'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>

            {/* Delete */}
            <button
              id="delete-course-btn"
              onClick={() => setDeleteOpen(true)}
              title="Delete this course"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                minHeight: '44px',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '9px',
                color: '#FCA5A5',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.45)'
                e.currentTarget.style.color = '#FFFFFF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.06)'
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
                e.currentTarget.style.color = '#FCA5A5'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
              Delete Course
            </button>
          </div>
        </div>

        {/* Course name */}
        <h1 style={{
          fontSize: '26px',
          fontWeight: '800',
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          marginBottom: course.description ? '12px' : '0',
        }}>
          {course.name}
        </h1>

        {/* Description */}
        {course.description && (
          <p style={{
            fontSize: '14px',
            color: '#64748B',
            lineHeight: 1.7,
            maxWidth: '700px',
          }}>
            {course.description}
          </p>
        )}

        {/* Created date */}
        <p style={{ fontSize: '12px', color: '#334155', marginTop: '16px', fontWeight: '500' }}>
          Created {new Date(course.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Modals */}
      <CourseFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        userId={userId}
        course={course}
      />
      <DeleteConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        courseId={course.id}
        courseName={course.name}
        courseCode={course.code}
      />
    </>
  )
}
