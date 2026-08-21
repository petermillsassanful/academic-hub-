'use client'

import Link from 'next/link'
import { PullToRefresh } from '@/components/ui/PullToRefresh'
import type { Course } from '@/types/database'

interface StudentCoursesClientProps {
  courses: Course[]
  level: string | null | undefined
}

export function StudentCoursesClient({ courses, level }: StudentCoursesClientProps) {
  return (
    <PullToRefresh>
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          marginBottom: '6px',
        }}>
          My Courses
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B' }}>
          {level ? `All courses available at Level ${level}` : 'Your enrolled courses'}
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <div style={{
            width: '72px',
            height: '72px',
            margin: '0 auto 20px',
            background: 'rgba(79,70,229,0.1)',
            border: '1px solid rgba(79,70,229,0.2)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px', letterSpacing: '-0.01em' }}>
            No courses yet
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '360px', margin: '0 auto', lineHeight: 1.6 }}>
            No courses are available for your level yet. They will appear here once your lecturers create them.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {courses.map((course) => (
            <Link key={course.id} href={`/student/courses/${course.id}`} style={{ textDecoration: 'none' }}>
              <div
                className="glass-card"
                style={{ padding: '20px 22px', transition: 'all 150ms ease', cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(79,70,229,0.4)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{
                    padding: '3px 8px',
                    background: 'rgba(79,70,229,0.12)',
                    border: '1px solid rgba(79,70,229,0.3)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#818CF8',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>
                    {course.code}
                  </span>
                  <span style={{ fontSize: '11px', color: '#475569' }}>{course.semester}</span>
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', lineHeight: 1.4 }}>
                  {course.name}
                </h3>
                {course.description && (
                  <p style={{
                    fontSize: '12px', color: '#64748B', lineHeight: 1.5, marginTop: '6px',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {course.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  )
}
