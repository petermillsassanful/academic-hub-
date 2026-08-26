import { redirect } from 'next/navigation'
import { getUser, getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { AdminDashboardClient } from './AdminDashboardClient'
import type { Course } from '@/types/database'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin Dashboard — Academic Hub',
  description: 'Manage your courses and students from the Academic Hub admin dashboard.',
}

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}

function StatCard({ label, value, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div
      className="glass-card"
      style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '16px', background: '#FFFFFF' }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: iconColor,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {value}
        </div>
        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', fontWeight: '500' }}>
          {label}
        </div>
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  // Cached — shared with layout, no extra network call
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()
  if (profile?.role !== 'admin') redirect('/student')

  const supabase = await createClient()

  // 1. Fetch courses and assignments in parallel
  const [coursesRes, assignmentsRes] = await Promise.all([
    supabase
      .from('courses')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('assignments')
      .select('id, course_id, courses!inner(created_by)')
      .eq('courses.created_by', user.id),
  ])

  const courses: Course[] = (coursesRes.data as Course[]) ?? []
  const totalCourses = courses.length
  const courseLevels = [...new Set(courses.map((c) => c.level))]
  const assignIds = (assignmentsRes.data ?? []).map((a: { id: string }) => a.id)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // 2. Fetch student count, pending submissions, and recent activity in parallel
  const [totalStudents, pendingSubmissions, recentActivityCount] = await Promise.all([
    courseLevels.length > 0
      ? supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')
          .in('level', courseLevels)
          .then(({ count }) => count ?? 0)
      : Promise.resolve(0),
    assignIds.length > 0
      ? supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .in('assignment_id', assignIds)
          .is('grade', null)
          .then(({ count }) => count ?? 0)
      : Promise.resolve(0),
    assignIds.length > 0
      ? supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .in('assignment_id', assignIds)
          .gte('submitted_at', sevenDaysAgo)
          .then(({ count }) => count ?? 0)
      : Promise.resolve(0),
  ])

  const stats: StatCardProps[] = [
    {
      label: 'Total Courses',
      value: totalCourses,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      label: 'Total Students',
      value: totalStudents,
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: 'Pending Submissions',
      value: pendingSubmissions,
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      label: 'Submissions (7 days)',
      value: recentActivityCount,
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ]

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
          Lecturer Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B' }}>
          Overview of your courses, enrolled students, and grading tasks
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '40px',
      }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Course list — client component handles modal + empty state */}
      <AdminDashboardClient userId={user.id} courses={courses} />
    </div>
  )
}
