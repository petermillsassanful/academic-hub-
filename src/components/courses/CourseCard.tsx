import Link from 'next/link'
import type { Course } from '@/types/database'

interface CourseCardProps {
  course: Course
  studentCount?: number
  basePath?: string // '/admin' or '/student'
}

export function CourseCard({ course, studentCount = 0, basePath = '/admin' }: CourseCardProps) {
  const href = `${basePath}/courses/${course.id}`

  return (
    <Link
      href={href}
      style={{ textDecoration: 'none', display: 'block' }}
      aria-label={`Open ${course.name}`}
    >
      <div
        className="glass-card"
        style={{
          padding: '22px',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '160px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(-2px)'
          el.style.borderColor = '#CBD5E1'
          el.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.06)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(0)'
          el.style.borderColor = '#E2E8F0'
          el.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div>
          {/* Top row: code badge + semester */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{
              display: 'inline-block',
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
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
              {course.level ? `Level ${course.level} — ` : ''}{course.semester}
            </span>
          </div>

          {/* Course name */}
          <h3 style={{
            fontSize: '16px',
            fontWeight: '800',
            color: '#0F172A',
            marginBottom: '6px',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
          }}>
            {course.name}
          </h3>

          {/* Description snippet */}
          {course.description && (
            <p style={{
              fontSize: '13px',
              color: '#64748B',
              lineHeight: 1.5,
              marginBottom: '14px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {course.description}
            </p>
          )}
        </div>

        {/* Footer: students + arrow */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: '1px solid #F1F5F9',
          marginTop: '12px',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', fontWeight: '600' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {studentCount} student{studentCount !== 1 ? 's' : ''}
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
