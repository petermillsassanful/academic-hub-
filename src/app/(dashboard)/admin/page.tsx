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
  gradientClass: string
  iconColor: string
}

function StatCard({ label, value, icon, gradientClass, iconColor }: StatCardProps) {
  return (
    <div
      className={`glass-card ${gradientClass}`}
      style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}
    >
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: iconColor,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
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

  // Fetch courses (needed before we can compute stats)
  const { data: coursesData } = await supabase
    .from('courses')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  const courses: Course[] = (coursesData as Course[]) ?? []
  const totalCourses = courses.length

  // Run student count + pending submissions in parallel
  const courseLevels = [...new Set(courses.map((c) => c.level))]
  const courseIds = courses.map((c) => c.id)

  const [totalStudents, pendingSubmissions] = await Promise.all([
    // Count students across all course levels
    courseLevels.length > 0
      ? supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')
          .in('level', courseLevels)
          .then(({ count }) => count ?? 0)
      : Promise.resolve(0),
    // Count ungraded submissions
    courseIds.length > 0
      ? supabase
          .from('assignments')
          .select('id')
          .in('course_id', courseIds)
          .then(({ data: assignData }) => {
            const assignIds = (assignData ?? []).map((a: { id: string }) => a.id)
            if (assignIds.length === 0) return 0
            return supabase
              .from('submissions')
              .select('*', { count: 'exact', head: true })
              .in('assignment_id', assignIds)
              .is('grade', null)
              .then(({ count }) => count ?? 0)
          })
      : Promise.resolve(0),
  ])

  // Count submissions across this admin's courses in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  let recentActivityCount = 0
  if (courseIds.length > 0) {
    const { data: recentAssignIds } = await supabase
      .from('assignments')
      .select('id')
      .in('course_id', courseIds)
    const recentIds = (recentAssignIds ?? []).map((a: { id: string }) => a.id)
    if (recentIds.length > 0) {
      const { count } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .in('assignment_id', recentIds)
        .gte('submitted_at', sevenDaysAgo)
      recentActivityCount = count ?? 0
    }
  }

  const stats: StatCardProps[] = [
    {
      label: 'Total Courses',
      value: totalCourses,
      gradientClass: 'stat-gradient-indigo',
      iconColor: '#818CF8',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      label: 'Total Students',
      value: totalStudents,
      gradientClass: 'stat-gradient-emerald',
      iconColor: '#34D399',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      gradientClass: 'stat-gradient-amber',
      iconColor: '#FCD34D',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      gradientClass: 'stat-gradient-slate',
      iconColor: '#94A3B8',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          marginBottom: '6px',
        }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B' }}>
          Overview of your Academic Hub platform
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
