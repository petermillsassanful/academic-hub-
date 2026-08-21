import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { CourseTabBar } from '@/components/courses/CourseTabBar'
import { MaterialsTab } from './tabs/MaterialsTab'
import { LecturesTab } from './tabs/LecturesTab'
import { StudentAssignmentsTab } from './tabs/StudentAssignmentsTab'
import { GradesTab } from './tabs/GradesTab'
import Link from 'next/link'
import type { Course, CourseMaterial, CourseRecording, Assignment, Submission } from '@/types/database'

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

export default async function StudentCoursePage({ params, searchParams }: PageProps) {
  const { id }        = await params
  const { tab, assignment: selectedAssignmentId } = await searchParams
  const activeTab     = tab ?? 'lectures'

  // Cached — shared with layout
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

  let materials:  CourseMaterial[] = []
  let recordings: CourseRecording[] = []
  let assignments: Assignment[] = []
  let submissions: Submission[] = []
  let selectedAssignment: Assignment | undefined
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
    // Fetch assignments and student submissions in parallel
    const [aResult, sResult] = await Promise.all([
      supabase.from('assignments').select('*').eq('course_id', id).order('deadline'),
      supabase.from('submissions').select('*').eq('student_id', user.id),
    ])
    assignments = (aResult.data as Assignment[]) ?? []
    const allSubs = (sResult.data as Submission[]) ?? []

    // Filter submissions to only this course's assignments
    const assignIds = new Set(assignments.map((a) => a.id))
    submissions = allSubs.filter((s) => assignIds.has(s.assignment_id))

    if (selectedAssignmentId) {
      selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId)
    }
  }

  if (activeTab === 'grades') {
    // Fetch graded submissions and course assignment IDs in parallel
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
    <div style={{ maxWidth: '1100px' }}>
      {/* Back */}
      <Link
        href="/student"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', textDecoration: 'none', marginBottom: '20px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back to Dashboard
      </Link>

      {/* Course header */}
      <div className="glass-card" style={{ padding: '28px 32px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '4px 11px', background: 'rgba(79,70,229,0.12)',
            border: '1px solid rgba(79,70,229,0.3)', borderRadius: '7px',
            fontSize: '12px', fontWeight: '700', color: '#818CF8', letterSpacing: '0.07em', textTransform: 'uppercase',
          }}>{course.code}</span>
          <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1E293B', borderRadius: '7px', fontSize: '12px', color: '#64748B' }}>
            {course.semester}
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: course.description ? '12px' : '0' }}>
          {course.name}
        </h1>
        {course.description && (
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.7, maxWidth: '700px' }}>{course.description}</p>
        )}
      </div>

      <CourseTabBar role="student" activeTab={activeTab} />

      {activeTab === 'lectures'    && <LecturesTab recordings={recordings} />}
      {activeTab === 'materials'   && <MaterialsTab materials={materials} />}
      {activeTab === 'assignments' && (
        <StudentAssignmentsTab
          assignments={assignments}
          submissions={submissions}
          selectedAssignment={selectedAssignment}
          courseId={id}
          userId={user.id}
        />
      )}
      {activeTab === 'grades'      && <GradesTab grades={grades} />}
    </div>
  )
}
