'use client'

import { useState } from 'react'
import { CourseFormModal } from '@/components/ui/CourseFormModal'
import { CourseCard } from '@/components/courses/CourseCard'
import type { Course } from '@/types/database'

interface AdminCoursesClientProps {
  userId: string
  courses: Course[]
}

export function AdminCoursesClient({ userId, courses }: AdminCoursesClientProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const hasCourses = courses.length > 0

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '26px',
          fontWeight: '800',
          color: '#0F172A',
          letterSpacing: '-0.02em',
          marginBottom: '6px',
        }}>
          My Courses
        </h1>
        <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
          Manage all your courses in one place
        </p>
      </div>

      {/* Header row with New Course button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }} className="mobile-stack-header">
        <h2 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#0F172A',
          letterSpacing: '-0.01em',
          margin: 0,
        }}>
          {hasCourses ? `All Courses (${courses.length})` : 'All Courses'}
        </h2>
        <button
          id="new-course-btn-courses-page"
          onClick={() => setModalOpen(true)}
          className="btn-primary"
          style={{ padding: '8px 18px', fontSize: '13px', minHeight: '40px', display: 'flex', alignItems: 'center', gap: '7px' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Course
        </button>
      </div>

      {/* Course grid OR empty state */}
      {hasCourses ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} basePath="/admin" />
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', background: '#FFFFFF' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            background: '#EFF6FF',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="12" y1="7" x2="12" y2="13" />
              <line x1="9" y1="10" x2="15" y2="10" />
            </svg>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.01em' }}>
            No courses yet
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '360px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Get started by creating your first course. You can add lessons, assignments, and enroll students once you&apos;re set up.
          </p>

          <button
            id="create-first-course-courses-page"
            onClick={() => setModalOpen(true)}
            className="btn-primary"
            style={{ padding: '10px 24px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Your First Course
          </button>
        </div>
      )}

      {/* Course creation modal */}
      <CourseFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={userId}
      />
    </div>
  )
}
