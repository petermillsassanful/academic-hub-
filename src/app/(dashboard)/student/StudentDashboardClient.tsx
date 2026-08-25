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
    <div style={{ maxWidth: '960px' }}>
      {/* Greeting header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '26px',
          fontWeight: '800',
          color: '#0F172A',
          letterSpacing: '-0.02em',
          marginBottom: '6px',
        }}>
          Welcome back, {firstName}
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B' }}>
          {studentLevel ? `Level ${studentLevel}` : ''}{indexNumber ? ` — ${indexNumber}` : ''} — Here&apos;s your academic portal overview
        </p>
      </div>

      {/* Courses */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          Enrolled Courses
        </h2>
        {courses.length === 0 ? (
          <div className="glass-card" style={{ padding: '36px 28px', textAlign: 'center', background: '#FFFFFF' }}>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
              No courses available for your level yet. Courses will appear here once your lecturers create them.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
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
                    background: '#FFFFFF',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#CBD5E1'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)'
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
                    <span style={{ fontSize: '12px', color: '#64748B' }}>{course.semester}</span>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', lineHeight: 1.4, margin: 0 }}>
                    {course.name}
                  </h3>
                  {course.description && (
                    <p style={{
                      fontSize: '13px', color: '#64748B', lineHeight: 1.5, marginTop: '8px', marginBottom: 0,
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
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Upcoming Deadlines
        </h2>
        {upcomingDeadlines.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px 28px', background: '#FFFFFF' }}>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>No upcoming deadlines.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 150ms ease',
                      background: '#FFFFFF',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{a.title}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{a.courses.code} — {a.courses.name}</div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                      background: isUrgent ? '#FEE2E2' : '#FEF3C7',
                      color: isUrgent ? '#DC2626' : '#D97706',
                      border: `1px solid ${isUrgent ? '#FECACA' : '#FDE68A'}`,
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
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
            <circle cx="12" cy="8" r="6"/>
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
          Recent Grades
        </h2>
        {recentGrades.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px 28px', background: '#FFFFFF' }}>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>No grades yet. Once your submissions are reviewed, results will show here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentGrades.map((g) => {
              const pct = g.assignments.max_score > 0 ? ((g.grade ?? 0) / g.assignments.max_score) * 100 : 0
              const color = pct >= 70 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626'
              const bg = pct >= 70 ? '#ECFDF5' : pct >= 50 ? '#FFFBEB' : '#FEF2F2'
              const border = pct >= 70 ? '#A7F3D0' : pct >= 50 ? '#FDE68A' : '#FECACA'
              return (
                <div key={g.id} className="glass-card" style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  background: '#FFFFFF',
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{g.assignments.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Graded {g.graded_at ? new Date(g.graded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                      {g.grade} / {g.assignments.max_score}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: bg,
                      border: `1px solid ${border}`,
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
