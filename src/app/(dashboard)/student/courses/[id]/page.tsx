import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { StudentCourseClient } from './StudentCourseClient'
import type { Course, CourseMaterial, CourseRecording, Assignment, Submission, Quiz, QuizQuestion, QuizAttempt } from '@/types/database'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; assignment?: string }>
}

interface QuizWithDetails extends Quiz {
  questions?: QuizQuestion[]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('name, code').eq('id', id).single<{ name: string; code: string }>()
  return { title: data ? `${data.name} — Academic Hub` : 'Course — Academic Hub' }
}

export default async function StudentCoursePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab, assignment: selectedAssignmentId } = await searchParams
  const activeTab = tab ?? 'materials'

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // 1. Fetch course details
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single<Course>()

  if (!course) notFound()

  // 2. Fetch all course tab resources in parallel for instant client-side tab switching
  const [materialsRes, recordingsRes, assignmentsRes, submissionsRes, quizzesRes, attemptsRes] = await Promise.all([
    supabase.from('course_materials').select('*').eq('course_id', id).order('week_number').order('uploaded_at'),
    supabase.from('course_recordings').select('*').eq('course_id', id).order('week_number').order('uploaded_at'),
    supabase.from('assignments').select('*').eq('course_id', id).order('deadline'),
    supabase.from('submissions').select('*, assignments(title, max_score)').eq('student_id', user.id),
    supabase.from('quizzes').select('*, questions:quiz_questions(*)').eq('course_id', id).eq('is_published', true).order('created_at', { ascending: false }),
    supabase.from('quiz_attempts').select('*').eq('student_id', user.id),
  ])

  const materials = (materialsRes.data as CourseMaterial[]) ?? []
  const recordings = (recordingsRes.data as CourseRecording[]) ?? []
  const assignments = (assignmentsRes.data as Assignment[]) ?? []
  const allSubmissions = (submissionsRes.data as any[]) ?? []
  const quizzes = (quizzesRes.data as unknown as QuizWithDetails[]) ?? []
  const attempts = (attemptsRes.data as QuizAttempt[]) ?? []

  const assignIds = new Set(assignments.map((a) => a.id))
  const submissions = allSubmissions.filter((s) => assignIds.has(s.assignment_id))
  const grades = allSubmissions.filter((s) => assignIds.has(s.assignment_id) && s.grade !== null)

  let selectedAssignment: Assignment | undefined
  if (selectedAssignmentId) {
    selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId)
  }

  return (
    <StudentCourseClient
      course={course}
      activeTab={activeTab}
      materials={materials}
      recordings={recordings}
      assignments={assignments}
      submissions={submissions}
      selectedAssignment={selectedAssignment}
      quizzes={quizzes}
      attempts={attempts}
      grades={grades}
      userId={user.id}
    />
  )
}
