import { redirect } from 'next/navigation'
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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, level')
    .eq('id', user.id)
    .single<{ role: string; level: string | null }>()

  if (profile?.role !== 'student') redirect('/admin')

  let courses: Course[] = []
  if (profile?.level) {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('level', profile.level)
      .order('created_at', { ascending: false })
    courses = (data as Course[]) ?? []
  }

  return <StudentCoursesClient courses={courses} level={profile?.level} />
}
