import { redirect } from 'next/navigation'
import { getUser, getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Course } from '@/types/database'
import { StudentCoursesClient } from './StudentCoursesClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Courses — Academic Hub',
  description: 'View all courses available at your level.',
}

export default async function StudentCoursesPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()
  if (profile?.role !== 'student') redirect('/admin')

  let courses: Course[] = []
  if (profile?.level) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('level', profile.level)
      .order('created_at', { ascending: false })
    courses = (data as Course[]) ?? []
  }

  return <StudentCoursesClient courses={courses} level={profile?.level} />
}
