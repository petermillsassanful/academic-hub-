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

  // Fetch course directly — RLS (is_same_level) handles access control
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single<Course>()

  if (!course) notFound()

  // ── Tab-specific data ─────────────────────────────────────────────────────────

  let materials: CourseMaterial[] = []
  let recordings: CourseRecording[] = []
  let assignments: Assignment[] = []
  let submissions: Submission[] = []
  let selectedAssignment: Assignment | undefined
  let quizzes: QuizWithDetails[] = []
  let attempts: QuizAttempt[] = []
  let grades: (Submission & { assignments: Pick<Assignment, 'title' | 'max_score'> })[] = []

  if (activeTab === 'materials') {
    const { data } = await supabase.from('course_materials').select('*').eq('course_id', id).order('week_number').order('uploaded_at')
    materials = (data as CourseMaterial[]) ?? []
  }

  if (activeTab === 'lectures') {
    const { data } = await supabase.from('course_recordings').select('*').eq('course_id', id).order('week_number').order('uploaded_at')
    recordings = (data as CourseRecording[]) ?? []
  }

  if (activeTab === 'assignments') {
    const [aResult, sResult] = await Promise.all([
      supabase.from('assignments').select('*').eq('course_id', id).order('deadline'),
      supabase.from('submissions').select('*').eq('student_id', user.id),
    ])
    assignments = (aResult.data as Assignment[]) ?? []
    const allSubs = (sResult.data as Submission[]) ?? []

    const assignIds = new Set(assignments.map((a) => a.id))
    submissions = allSubs.filter((s) => assignIds.has(s.assignment_id))

    if (selectedAssignmentId) {
      selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId)
    }
  }

  if (activeTab === 'quizzes' || activeTab === 'grades') {
    const [qResult, attResult] = await Promise.all([
      supabase
        .from('quizzes')
        .select('*, questions:quiz_questions(*)')
        .eq('course_id', id)
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('quiz_attempts')
        .select('*')
        .eq('student_id', user.id),
    ])
    quizzes = (qResult.data as unknown as QuizWithDetails[]) ?? []
    attempts = (attResult.data as QuizAttempt[]) ?? []
  }

  if (activeTab === 'grades') {
    const [gradesResult, courseAssignsResult] = await Promise.all([
      supabase
        .from('submissions')
        .select('*, assignments(title, max_score)')
        .eq('student_id', user.id)
        .not('grade', 'is', null)
        .order('graded_at', { ascending: false }),
      supabase.from('assignments').select('id').eq('course_id', id),
    ])
    const allGrades = ((gradesResult.data ?? []) as typeof grades)
    const courseAssignIds = new Set((courseAssignsResult.data ?? []).map((a: { id: string }) => a.id))
    grades = allGrades.filter((g) => courseAssignIds.has(g.assignment_id))
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
