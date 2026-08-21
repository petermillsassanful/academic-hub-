'use client'

import Link from 'next/link'
import { PullToRefresh } from '@/components/ui/PullToRefresh'
import type { Course, Assignment, Submission } from '@/types/database'

interface StudentDashboardClientProps {
  firstName: string
  studentLevel: string | null
  indexNumber: string | null
  courses: Course[]
  upcomingDeadlines: (Assignment & { courses: { name: string; code: string } })[]
  recentGrades: (Submission & { assignments: { title: string; max_score: number } })[]
}

export function StudentDashboardClient({
  firstName,
  studentLevel,
  indexNumber,
  courses,
  upcomingDeadlines,
  recentGrades,
}: StudentDashboardClientProps) {
  return (
    <PullToRefresh>
    <div style={{ maxWidth: '900px' }}>
      {/* Greeting header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          marginBottom: '6px',
        }}>
          Welcome back, {firstName}
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B' }}>
          {studentLevel ? `Level ${studentLevel}` : ''}{indexNumber ? ` — ${indexNumber}` : ''} — Here&apos;s your academic overview
        </p>
      </div>

      {/* Courses */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="1.75">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          Your Courses
        </h2>
        {courses.length === 0 ? (
          <div className="glass-card" style={{ padding: '36px 28px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#64748B' }}>
              No courses available for your level yet. Courses will appear here once your lecturers create them.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/student/courses/${course.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="glass-card"
                  style={{
                    padding: '20px 22px',
                    transition: 'all 150ms ease',
                    cursor: 'pointer',
                  }}
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

      {/* Upcoming Deadlines */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="1.75">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Upcoming Deadlines
        </h2>
        {upcomingDeadlines.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px 28px' }}>
            <p style={{ fontSize: '13px', color: '#64748B' }}>No upcoming deadlines.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingDeadlines.map((a) => {
              const deadlineDate = new Date(a.deadline)
              const now = new Date()
              const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              const isUrgent = daysLeft <= 2
              return (
                <Link key={a.id} href={`/student/courses/${a.course_id}?tab=assignments&assignment=${a.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    className="glass-card"
                    style={{
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'border-color 150ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.4)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '' }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>{a.title}</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{a.courses.code} — {a.courses.name}</div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '7px',
                      fontSize: '11px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      background: isUrgent ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.1)',
                      color: isUrgent ? '#FCA5A5' : '#FCD34D',
                      border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)'}`,
                    }}>
                      {daysLeft <= 0 ? 'Due today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Grades */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="1.75">
            <circle cx="12" cy="8" r="6"/>
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
          Recent Grades
        </h2>
        {recentGrades.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px 28px' }}>
            <p style={{ fontSize: '13px', color: '#64748B' }}>No grades yet. Once your submissions are reviewed, results will show here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentGrades.map((g) => {
              const pct = g.assignments.max_score > 0 ? ((g.grade ?? 0) / g.assignments.max_score) * 100 : 0
              const color = pct >= 70 ? '#34D399' : pct >= 50 ? '#FCD34D' : '#FCA5A5'
              return (
                <div key={g.id} className="glass-card" style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>{g.assignments.title}</div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                      Graded {g.graded_at ? new Date(g.graded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color }}>
                      {g.grade}/{g.assignments.max_score}
                    </span>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: `${color}18`,
                      color,
                    }}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  )
}
