'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CourseFormModal } from '@/components/ui/CourseFormModal'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import { CourseTabBar } from '@/components/courses/CourseTabBar'
import { ContentTab } from './tabs/ContentTab'
import { RecordingsTab } from './tabs/RecordingsTab'
import { AssignmentsTab, type AssignmentWithCount } from './tabs/AssignmentsTab'
import { StudentsTab } from './tabs/StudentsTab'
import { AnalyticsTab } from './tabs/AnalyticsTab'
import { QuizzesTab, type QuizWithStats } from './tabs/QuizzesTab'
import { type SubmissionWithProfile } from './tabs/GradingPanel'
import type { Course, CourseMaterial, CourseRecording, Assignment, Submission, Profile } from '@/types/database'

interface CoursePageClientProps {
  course: Course
  userId: string
  studentCount: number
  activeTab: string
  materials: CourseMaterial[]
  recordings: CourseRecording[]
  assignments: AssignmentWithCount[]
  selectedAssignment?: Assignment
  submissions: SubmissionWithProfile[]
  quizzes: QuizWithStats[]
  students: Profile[]
  allAssignments: Assignment[]
  allSubmissions: Submission[]
}

export function CoursePageClient({
  course,
  userId,
  studentCount,
  activeTab,
  materials,
  recordings,
  assignments,
  selectedAssignment,
  submissions,
  quizzes,
  students,
  allAssignments,
  allSubmissions,
}: CoursePageClientProps) {
  const [currentTab, setCurrentTab] = useState(activeTab)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Back link */}
      <Link
        href="/admin"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#1B2559',
          textDecoration: 'none',
          marginBottom: '16px',
          transition: 'color 150ms ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        ← Back to Lecturer Dashboard
      </Link>

      {/* Course Header Card */}
      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '24px', background: '#FFFFFF' }}>
        {/* Top row: badge + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }} className="mobile-stack-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
            <span style={{
              padding: '4px 10px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748B',
              fontWeight: '600',
            }}>
              {studentCount} student{studentCount !== 1 ? 's' : ''} enrolled
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }} className="course-action-row">
            {/* Edit */}
            <button
              id="edit-course-btn"
              onClick={() => setEditOpen(true)}
              title="Edit course details"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                minHeight: '38px',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F8FAFC'
                e.currentTarget.style.borderColor = '#94A3B8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF'
                e.currentTarget.style.borderColor = '#CBD5E1'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Course
            </button>

            {/* Delete */}
            <button
              id="delete-course-btn"
              onClick={() => setDeleteOpen(true)}
              title="Delete this course"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                minHeight: '38px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                color: '#DC2626',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FEE2E2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FEF2F2'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
              Delete
            </button>
          </div>
        </div>

        {/* Course name */}
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

        {/* Description */}
        {course.description && (
          <p style={{
            fontSize: '14px',
            color: '#475569',
            lineHeight: 1.6,
            maxWidth: '780px',
            margin: '0 0 12px',
          }}>
            {course.description}
          </p>
        )}

        {/* Created date */}
        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, fontWeight: '500' }}>
          Created on {new Date(course.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Tabs */}
      <CourseTabBar role="admin" activeTab={currentTab} onTabChange={setCurrentTab} />

      {currentTab === 'content' && <ContentTab courseId={course.id} materials={materials} />}
      {currentTab === 'recordings' && <RecordingsTab courseId={course.id} recordings={recordings} />}
      {currentTab === 'assignments' && (
        <AssignmentsTab
          courseId={course.id}
          assignments={assignments}
          selectedAssignment={selectedAssignment}
          submissions={submissions}
        />
      )}
      {currentTab === 'quizzes' && (
        <QuizzesTab
          courseId={course.id}
          quizzes={quizzes}
        />
      )}
      {currentTab === 'students' && (
        <StudentsTab
          students={students}
          assignments={allAssignments}
          submissions={allSubmissions}
          courseName={course.name}
        />
      )}
      {currentTab === 'analytics' && (
        <AnalyticsTab
          students={students}
          assignments={allAssignments}
          submissions={allSubmissions}
        />
      )}

      {/* Modals */}
      <CourseFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        userId={userId}
        course={course}
      />
      <DeleteConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        courseId={course.id}
        courseName={course.name}
        courseCode={course.code}
      />
    </div>
  )
}
