import { redirect, notFound } from 'next/navigation'
import { getUser, getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { CourseTabBar } from '@/components/courses/CourseTabBar'
import { CoursePageClient } from './CoursePageClient'
import { ContentTab } from './tabs/ContentTab'
import { RecordingsTab } from './tabs/RecordingsTab'
import { AssignmentsTab, type AssignmentWithCount } from './tabs/AssignmentsTab'
import { StudentsTab } from './tabs/StudentsTab'
import { AnalyticsTab } from './tabs/AnalyticsTab'
import { type SubmissionWithProfile } from './tabs/GradingPanel'
import { QuizzesTab, type QuizWithStats } from './tabs/QuizzesTab'
import type { Course, CourseMaterial, CourseRecording, Assignment, Submission, Profile, Quiz, QuizQuestion, QuizAttempt } from '@/types/database'

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
  const { id }         = await params
  const { tab, assignment: selectedAssignmentId } = await searchParams
  const activeTab      = tab ?? 'content'

  // Cached — shared with layout, no extra network call
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Fetch course + student count in parallel
  const [courseResult, studentCountResult] = await Promise.all([
    supabase.from('courses').select('*').eq('id', id).eq('created_by', user.id).single<Course>(),
    // We need the course level for student count, but we can start the query pattern
    // and handle it after we know the course exists
    Promise.resolve(null), // placeholder — resolved below once we have course.level
  ])

  if (courseResult.error || !courseResult.data) notFound()
  const courseData = courseResult.data

  // Now get student count with the known level
  const { count: studentCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
    .eq('level', courseData.level)

  // ── Tab-specific data (only fetch what this tab needs) ────────────────────────

  let materials:          CourseMaterial[]        = []
  let recordings:         CourseRecording[]        = []
  let assignmentsWithCounts: AssignmentWithCount[] = []
  let selectedAssignment: Assignment | undefined
  let submissions:        SubmissionWithProfile[]  = []
  let quizzesWithStats:   QuizWithStats[]          = []
  let studentsTabData: { students: Profile[]; assignments: Assignment[]; submissions: Submission[] } | undefined
  let analyticsTabData: { students: Profile[]; assignments: Assignment[]; submissions: Submission[] } | undefined

  if (activeTab === 'content') {
    const { data } = await supabase.from('course_materials').select('*').eq('course_id', id).order('week_number').order('uploaded_at')
    materials = (data as CourseMaterial[]) ?? []
  }

  if (activeTab === 'recordings') {
    const { data } = await supabase.from('course_recordings').select('*').eq('course_id', id).order('week_number').order('uploaded_at')
    recordings = (data as CourseRecording[]) ?? []
  }

  if (activeTab === 'assignments') {
    const { data: assignData } = await supabase
      .from('assignments').select('*').eq('course_id', id).order('created_at')
    const allAssignments = (assignData as Assignment[]) ?? []

    const assignIds = allAssignments.map((a) => a.id)
    const { data: subCountData } = await supabase
      .from('submissions').select('assignment_id')
      .in('assignment_id', assignIds.length > 0 ? assignIds : ['00000000-0000-0000-0000-000000000000'])
    const countMap = new Map<string, number>()
    for (const s of subCountData ?? []) {
      countMap.set((s as { assignment_id: string }).assignment_id, (countMap.get((s as { assignment_id: string }).assignment_id) ?? 0) + 1)
    }
    assignmentsWithCounts = allAssignments.map((a) => ({ ...a, submissionCount: countMap.get(a.id) ?? 0 }))

    if (selectedAssignmentId) {
      selectedAssignment = allAssignments.find((a) => a.id === selectedAssignmentId)
      if (selectedAssignment) {
        const { data: subData } = await supabase
          .from('submissions')
          .select('*, profiles!student_id(full_name, email)')
          .eq('assignment_id', selectedAssignmentId)
          .order('submitted_at', { ascending: false })
        submissions = (subData as SubmissionWithProfile[]) ?? []
      }
    }
  }

  if (activeTab === 'quizzes') {
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', id)
      .order('created_at', { ascending: false })

    const allQuizzes = (quizData as Quiz[]) ?? []
    const quizIds = allQuizzes.map((q) => q.id)

    if (quizIds.length > 0) {
      const [questionsRes, attemptsRes] = await Promise.all([
        supabase.from('quiz_questions').select('*').in('quiz_id', quizIds).order('order_index'),
        supabase.from('quiz_attempts').select('*, student:profiles!student_id(full_name, email, index_number)').in('quiz_id', quizIds),
      ])

      const allQuestions = (questionsRes.data as QuizQuestion[]) ?? []
      const allAttempts = (attemptsRes.data as any[]) ?? []

      quizzesWithStats = allQuizzes.map((quiz) => {
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
    } else {
      quizzesWithStats = []
    }
  }

  if (activeTab === 'students') {
    // Run all three queries in parallel
    const [studentResult, assignResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('level', courseData.level)
        .order('full_name'),
      supabase
        .from('assignments')
        .select('*')
        .eq('course_id', id)
        .order('created_at'),
    ])
    const allStudents = (studentResult.data as Profile[]) ?? []
    const allAssignments = (assignResult.data as Assignment[]) ?? []

    // Fetch submissions (depends on assignment IDs)
    const assignIds = allAssignments.map((a) => a.id)
    let allSubmissions: Submission[] = []
    if (assignIds.length > 0) {
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .in('assignment_id', assignIds)
      allSubmissions = (subData as Submission[]) ?? []
    }

    studentsTabData = { students: allStudents, assignments: allAssignments, submissions: allSubmissions }
  }

  if (activeTab === 'analytics') {
    const [studentResult, assignResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('level', courseData.level),
      supabase
        .from('assignments')
        .select('*')
        .eq('course_id', id)
        .order('created_at'),
    ])
    const allStudents = (studentResult.data as Profile[]) ?? []
    const allAssignments = (assignResult.data as Assignment[]) ?? []

    const assignIds = allAssignments.map((a) => a.id)
    let allSubmissions: Submission[] = []
    if (assignIds.length > 0) {
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .in('assignment_id', assignIds)
      allSubmissions = (subData as Submission[]) ?? []
    }

    analyticsTabData = { students: allStudents, assignments: allAssignments, submissions: allSubmissions }
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      <CoursePageClient course={courseData} userId={user.id} studentCount={studentCount ?? 0} />
      <CourseTabBar role="admin" activeTab={activeTab} />

      {activeTab === 'content'     && <ContentTab    courseId={id} materials={materials} />}
      {activeTab === 'recordings'  && <RecordingsTab courseId={id} recordings={recordings} />}
      {activeTab === 'assignments' && (
        <AssignmentsTab
          courseId={id}
          assignments={assignmentsWithCounts}
          selectedAssignment={selectedAssignment}
          submissions={submissions}
        />
      )}
      {activeTab === 'quizzes' && (
        <QuizzesTab
          courseId={id}
          quizzes={quizzesWithStats}
        />
      )}
      {activeTab === 'students' && studentsTabData && (
        <StudentsTab
          students={studentsTabData.students}
          assignments={studentsTabData.assignments}
          submissions={studentsTabData.submissions}
          courseName={courseData.name}
        />
      )}
      {activeTab === 'analytics' && analyticsTabData && (
        <AnalyticsTab
          students={analyticsTabData.students}
          assignments={analyticsTabData.assignments}
          submissions={analyticsTabData.submissions}
        />
      )}
    </div>
  )
}
