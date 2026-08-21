import { redirect } from 'next/navigation'
import { getUser, getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Course } from '@/types/database'
import { AdminCoursesClient } from './AdminCoursesClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Courses — Academic Hub',
  description: 'Manage your courses.',
}

export default async function AdminCoursesPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()
  if (profile?.role !== 'admin') redirect('/student')

  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  const courses: Course[] = (data as Course[]) ?? []

  return <AdminCoursesClient userId={user.id} courses={courses} />
}
