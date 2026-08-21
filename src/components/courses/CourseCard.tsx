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
          padding: '20px',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          borderColor: 'rgba(79,70,229,0.1)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(-2px)'
          el.style.borderColor = 'rgba(79,70,229,0.35)'
          el.style.boxShadow = '0 8px 32px rgba(79,70,229,0.15)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(0)'
          el.style.borderColor = 'rgba(79,70,229,0.1)'
          el.style.boxShadow = ''
        }}
      >
        {/* Top row: code badge + semester */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 9px',
            background: 'rgba(79,70,229,0.12)',
            border: '1px solid rgba(79,70,229,0.25)',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            color: '#818CF8',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {course.code}
          </span>
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>
            {course.semester}
          </span>
        </div>

        {/* Course name */}
        <h3 style={{
          fontSize: '15px',
          fontWeight: '700',
          color: '#FFFFFF',
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

        {/* Footer: students + arrow */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: '1px solid #1E293B',
          marginTop: course.description ? 0 : '14px',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {studentCount} student{studentCount !== 1 ? 's' : ''}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
