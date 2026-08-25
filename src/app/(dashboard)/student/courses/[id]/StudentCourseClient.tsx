'use client'

import { useState } from 'react'
import { CourseTabBar } from '@/components/courses/CourseTabBar'
import { MaterialsTab } from './tabs/MaterialsTab'
import { LecturesTab } from './tabs/LecturesTab'
import { StudentAssignmentsTab } from './tabs/StudentAssignmentsTab'
import { StudentQuizzesTab } from './tabs/StudentQuizzesTab'
import { QuizTestRoom } from './tabs/QuizTestRoom'
import { GradesTab } from './tabs/GradesTab'
import Link from 'next/link'
import type { Course, CourseMaterial, CourseRecording, Assignment, Submission, Quiz, QuizQuestion, QuizAttempt } from '@/types/database'

interface QuizWithDetails extends Quiz {
  questions?: QuizQuestion[]
}

interface StudentCourseClientProps {
  course: Course
  activeTab: string
  materials: CourseMaterial[]
  recordings: CourseRecording[]
  assignments: Assignment[]
  submissions: Submission[]
  selectedAssignment?: Assignment
  quizzes: QuizWithDetails[]
  attempts: QuizAttempt[]
  grades: (Submission & { assignments: Pick<Assignment, 'title' | 'max_score'> })[]
  userId: string
}

export function StudentCourseClient({
  course,
  activeTab,
  materials,
  recordings,
  assignments,
  submissions,
  selectedAssignment,
  quizzes,
  attempts,
  grades,
  userId,
}: StudentCourseClientProps) {
  const [activeQuizForTest, setActiveQuizForTest] = useState<QuizWithDetails | null>(null)
  const [activeQuizAttempt, setActiveQuizAttempt] = useState<QuizAttempt | undefined>(undefined)

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* If taking a quiz / CBT test, show the full testing room view */}
      {activeQuizForTest ? (
        <QuizTestRoom
          quiz={activeQuizForTest}
          courseId={course.id}
          userId={userId}
          existingAttempt={activeQuizAttempt}
          onExit={() => {
            setActiveQuizForTest(null)
            setActiveQuizAttempt(undefined)
          }}
        />
      ) : (
        <>
          {/* Back */}
          <Link
            href="/student"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1B2559',
              textDecoration: 'none',
              marginBottom: '16px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            ← Back to Student Dashboard
          </Link>

          {/* Course header */}
          <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '24px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 10px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#1D4ED8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {course.code}
              </span>
              <span style={{
                padding: '4px 10px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#64748B',
                fontWeight: '600',
              }}>
                {course.semester}
              </span>
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#0F172A',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: course.description ? '10px' : '0',
            }}>
              {course.name}
            </h1>
            {course.description && (
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, maxWidth: '780px', margin: 0 }}>
                {course.description}
              </p>
            )}
          </div>

          <CourseTabBar role="student" activeTab={activeTab} />

          {activeTab === 'materials' && <MaterialsTab materials={materials} />}
          {activeTab === 'lectures' && <LecturesTab recordings={recordings} />}
          {activeTab === 'assignments' && (
            <StudentAssignmentsTab
              assignments={assignments}
              submissions={submissions}
              selectedAssignment={selectedAssignment}
              courseId={course.id}
              userId={userId}
            />
          )}
          {activeTab === 'quizzes' && (
            <StudentQuizzesTab
              quizzes={quizzes}
              attempts={attempts}
              courseId={course.id}
              userId={userId}
              onSelectQuizToTake={(q, att) => {
                setActiveQuizForTest(q)
                setActiveQuizAttempt(att)
              }}
            />
          )}
          {activeTab === 'grades' && (
            <GradesTab
              grades={grades}
              quizGrades={attempts.filter((a) => a.submitted_at !== null).map((a) => {
                const quizObj = quizzes.find((q) => q.id === a.quiz_id)
                return {
                  ...a,
                  quizzes: quizObj ? { title: quizObj.title } : undefined,
                }
              })}
            />
          )}
        </>
      )}
    </div>
  )
}
