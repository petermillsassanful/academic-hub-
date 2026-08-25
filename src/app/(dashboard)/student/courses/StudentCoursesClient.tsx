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
          {level ? `All courses available at Level ${level}` : 'Your enrolled courses'}
        </p>
      </div>

      {courses.length === 0 ? (
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
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.01em' }}>
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
                style={{ padding: '20px 22px', transition: 'all 150ms ease', cursor: 'pointer', background: '#FFFFFF' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{
                    padding: '3px 8px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#1D4ED8',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>
                    {course.code}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>{course.semester}</span>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', lineHeight: 1.4, margin: '0 0 6px' }}>
                  {course.name}
                </h3>
                {course.description && (
                  <p style={{
                    fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: 0,
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
