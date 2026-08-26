import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { CoursePageClient } from './CoursePageClient'
import { type AssignmentWithCount } from './tabs/AssignmentsTab'
import { type SubmissionWithProfile } from './tabs/GradingPanel'
import { type QuizWithStats } from './tabs/QuizzesTab'
import type { Course, CourseMaterial, CourseRecording, Assignment, Submission, Profile, Quiz, QuizQuestion } from '@/types/database'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; assignment?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('name, code').eq('id', id).single<{ name: string; code: string }>()
  return { title: data ? `${data.name} — Academic Hub` : 'Course — Academic Hub' }
}

export default async function AdminCoursePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab, assignment: selectedAssignmentId } = await searchParams
  const activeTab = tab ?? 'content'

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // 1. Fetch course details first
  const { data: courseData, error: courseErr } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('created_by', user.id)
    .single<Course>()

  if (courseErr || !courseData) notFound()

  // 2. Fetch all course resources simultaneously in parallel for instant client-side tab switching
  const [
    studentCountRes,
    materialsRes,
    recordingsRes,
    assignmentsRes,
    quizzesRes,
    studentsRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('level', courseData.level),
    supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', id)
      .order('week_number')
      .order('uploaded_at'),
    supabase
      .from('course_recordings')
      .select('*')
      .eq('course_id', id)
      .order('week_number')
      .order('uploaded_at'),
    supabase
      .from('assignments')
      .select('*')
      .eq('course_id', id)
      .order('created_at'),
    supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('level', courseData.level)
      .order('full_name'),
  ])

  const studentCount = studentCountRes.count ?? 0
  const materials = (materialsRes.data as CourseMaterial[]) ?? []
  const recordings = (recordingsRes.data as CourseRecording[]) ?? []
  const allAssignments = (assignmentsRes.data as Assignment[]) ?? []
  const allQuizzes = (quizzesRes.data as Quiz[]) ?? []
  const students = (studentsRes.data as Profile[]) ?? []

  // 3. Batch fetch assignment submissions, quiz questions, and attempts in parallel
  const assignIds = allAssignments.map((a) => a.id)
  const quizIds = allQuizzes.map((q) => q.id)

  const [submissionsRes, questionsRes, attemptsRes] = await Promise.all([
    assignIds.length > 0
      ? supabase
          .from('submissions')
          .select('*, profiles!student_id(full_name, email)')
          .in('assignment_id', assignIds)
          .order('submitted_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    quizIds.length > 0
      ? supabase
          .from('quiz_questions')
          .select('*')
          .in('quiz_id', quizIds)
          .order('order_index')
      : Promise.resolve({ data: [] }),
    quizIds.length > 0
      ? supabase
          .from('quiz_attempts')
          .select('*, student:profiles!student_id(full_name, email, index_number)')
          .in('quiz_id', quizIds)
      : Promise.resolve({ data: [] }),
  ])

  const allSubmissionsRaw = (submissionsRes.data ?? []) as SubmissionWithProfile[]
  const allQuestions = (questionsRes.data ?? []) as QuizQuestion[]
  const allAttempts = (attemptsRes.data ?? []) as any[]

  // Assignment counts & selection
  const countMap = new Map<string, number>()
  for (const s of allSubmissionsRaw) {
    countMap.set(s.assignment_id, (countMap.get(s.assignment_id) ?? 0) + 1)
  }
  const assignmentsWithCounts: AssignmentWithCount[] = allAssignments.map((a) => ({
    ...a,
    submissionCount: countMap.get(a.id) ?? 0,
  }))

  let selectedAssignment: Assignment | undefined
  let submissionsForSelected: SubmissionWithProfile[] = []
  if (selectedAssignmentId) {
    selectedAssignment = allAssignments.find((a) => a.id === selectedAssignmentId)
    if (selectedAssignment) {
      submissionsForSelected = allSubmissionsRaw.filter((s) => s.assignment_id === selectedAssignmentId)
    }
  }

  // Quizzes with stats
  const quizzesWithStats: QuizWithStats[] = allQuizzes.map((quiz) => {
    const qList = allQuestions.filter((q) => q.quiz_id === quiz.id)
    const aList = allAttempts.filter((a) => a.quiz_id === quiz.id)
    return {
      ...quiz,
      questionCount: qList.length,
      attemptCount: aList.length,
      questions: qList,
      attempts: aList,
    }
  })

  return (
    <CoursePageClient
      course={courseData}
      userId={user.id}
      studentCount={studentCount}
      activeTab={activeTab}
      materials={materials}
      recordings={recordings}
      assignments={assignmentsWithCounts}
      selectedAssignment={selectedAssignment}
      submissions={submissionsForSelected}
      quizzes={quizzesWithStats}
      students={students}
      allAssignments={allAssignments}
      allSubmissions={allSubmissionsRaw as Submission[]}
    />
  )
}
