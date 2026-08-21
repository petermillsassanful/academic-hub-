import { redirect } from 'next/navigation'
import { getUser, getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Course, Assignment, Submission } from '@/types/database'
import { StudentDashboardClient } from './StudentDashboardClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Student Dashboard — Academic Hub',
  description: 'View your courses, upcoming deadlines, and recent grades.',
}

export default async function StudentDashboardPage() {
  // Cached — shared with layout, no extra network call
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()
  if (profile?.role !== 'student') redirect('/admin')

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const studentLevel = profile?.level

  const supabase = await createClient()

  // Fetch courses matching student's level
  let courses: Course[] = []
  if (studentLevel) {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('level', studentLevel)
      .order('created_at', { ascending: false })
    courses = (data as Course[]) ?? []
  }

  // Run deadlines + recent grades in parallel (both independent once we have courses)
  const courseIds = courses.map(c => c.id)

  const [upcomingDeadlines, recentGrades] = await Promise.all([
    // Upcoming deadlines
    courseIds.length > 0
      ? supabase
          .from('assignments')
          .select('*, courses(name, code)')
          .in('course_id', courseIds)
          .gt('deadline', new Date().toISOString())
          .order('deadline', { ascending: true })
          .limit(5)
          .then(({ data }) => (data as (Assignment & { courses: { name: string; code: string } })[]) ?? [])
      : Promise.resolve([] as (Assignment & { courses: { name: string; code: string } })[]),
    // Recent grades
    supabase
      .from('submissions')
      .select('*, assignments(title, max_score, course_id)')
      .eq('student_id', user.id)
      .not('grade', 'is', null)
      .order('graded_at', { ascending: false })
      .limit(5)
      .then(({ data }) => ((data ?? []) as (Submission & { assignments: { title: string; max_score: number } })[])),
  ])

  return (
    <StudentDashboardClient
      firstName={firstName}
      studentLevel={studentLevel}
      indexNumber={profile?.index_number ?? null}
      courses={courses}
      upcomingDeadlines={upcomingDeadlines}
      recentGrades={recentGrades}
    />
  )
}
