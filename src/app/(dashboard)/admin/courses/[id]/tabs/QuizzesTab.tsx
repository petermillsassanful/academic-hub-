'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Quiz, QuizQuestion } from '@/types/database'
import { QuizFormModal } from './QuizFormModal'
import { QuizResultsModal, type AttemptWithStudent } from './QuizResultsModal'
import { createCourseNotification } from '@/lib/notifications'

export interface QuizWithStats extends Quiz {
  questionCount: number
  attemptCount: number
  questions?: QuizQuestion[]
  attempts?: AttemptWithStudent[]
}

interface QuizzesTabProps {
  courseId: string
  quizzes: QuizWithStats[]
}

export function QuizzesTab({ courseId, quizzes }: QuizzesTabProps) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())

  const [formOpen, setFormOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<(Quiz & { questions?: QuizQuestion[] }) | undefined>()
  const [resultsQuiz, setResultsQuiz] = useState<QuizWithStats | null>(null)
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Toggle publish / unpublish
  async function handleTogglePublish(quiz: QuizWithStats) {
    setLoadingActionId(quiz.id)
    const newStatus = !quiz.is_published

    await supabaseRef.current
      .from('quizzes')
      .update({ is_published: newStatus } as never)
      .eq('id', quiz.id)

    if (newStatus) {
      // Send notification when published
      await createCourseNotification({
        courseId,
        title: 'New CBT Quiz Published',
        message: `Quiz '${quiz.title}' is now open for students to take. Passing mark: ${quiz.passing_score}%.`,
        type: 'quiz',
        link: `/student/courses/${courseId}?tab=quizzes`,
      })
    }

    setLoadingActionId(null)
    router.refresh()
  }

  // Delete quiz
  async function handleDelete(quizId: string) {
    if (!confirm('Are you sure you want to delete this quiz? All student attempts and questions will be permanently deleted.')) {
      return
    }

    setDeletingId(quizId)
    await supabaseRef.current.from('quizzes').delete().eq('id', quizId)
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div style={{ animation: 'tabFadeIn 200ms ease' }}>
      {/* Top action bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
            Timed Quizzes & CBT
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
            Create computer-based tests with question banks, time limits, and anti-cheating shuffling.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingQuiz(undefined)
            setFormOpen(true)
          }}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            minHeight: '40px',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          + Create New Quiz / CBT
        </button>
      </div>

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            color: '#2563EB',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '6px' }}>
            No Quizzes Created Yet
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            Set up timed tests with question pools, automated scoring, and randomized question distribution for your students.
          </p>
          <button
            onClick={() => {
              setEditingQuiz(undefined)
              setFormOpen(true)
            }}
            className="btn-primary"
            style={{
              padding: '9px 18px',
              minHeight: '40px',
              fontSize: '13px',
            }}
          >
            Create Your First Quiz
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {quizzes.map((quiz) => {
            const isPublished = quiz.is_published
            const isLoading = loadingActionId === quiz.id
            const isDeleting = deletingId === quiz.id

            return (
              <div
                key={quiz.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 150ms ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div>
                  {/* Status badge & Duration */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      background: isPublished ? '#ECFDF5' : '#F1F5F9',
                      border: isPublished ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                      color: isPublished ? '#059669' : '#64748B',
                    }}>
                      {isPublished ? '● Published' : '○ Draft'}
                    </span>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      color: '#D97706',
                      fontWeight: '700',
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      {quiz.duration_minutes} Mins
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 6px', lineHeight: 1.3 }}>
                    {quiz.title}
                  </h3>

                  {/* Description */}
                  {quiz.description && (
                    <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {quiz.description}
                    </p>
                  )}

                  {/* Metadata tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#1D4ED8',
                      fontWeight: '600',
                    }}>
                      📝 {quiz.questionCount} Questions in Bank
                    </span>

                    {quiz.questions_to_answer && (
                      <span style={{
                        padding: '4px 8px',
                        background: '#F0FDFA',
                        border: '1px solid #99F6E4',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#0F766E',
                        fontWeight: '600',
                      }}>
                        🎲 {quiz.questions_to_answer} per student
                      </span>
                    )}

                    {quiz.shuffle_questions && (
                      <span style={{
                        padding: '4px 8px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#475569',
                      }}>
                        🔀 Shuffled
                      </span>
                    )}

                    <span style={{
                      padding: '4px 8px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#475569',
                    }}>
                      🎯 Pass: {quiz.passing_score}%
                    </span>
                  </div>
                </div>

                {/* Footer action buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '14px',
                  borderTop: '1px solid #F1F5F9',
                }}>
                  {/* Results button */}
                  <button
                    onClick={() => setResultsQuiz(quiz)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: '6px',
                      color: '#1D4ED8',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: '5px 10px',
                    }}
                  >
                    👥 {quiz.attemptCount} Results
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Toggle publish button */}
                    <button
                      onClick={() => handleTogglePublish(quiz)}
                      disabled={isLoading}
                      title={isPublished ? 'Unpublish Quiz' : 'Publish Quiz to Students'}
                      style={{
                        padding: '6px 11px',
                        background: isPublished ? '#FEF3C7' : '#ECFDF5',
                        border: isPublished ? '1px solid #FDE68A' : '1px solid #A7F3D0',
                        borderRadius: '6px',
                        color: isPublished ? '#D97706' : '#059669',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isLoading ? '…' : isPublished ? 'Unpublish' : 'Publish'}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setEditingQuiz(quiz)
                        setFormOpen(true)
                      }}
                      title="Edit Quiz & Questions"
                      style={{
                        padding: '6px 10px',
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        color: '#475569',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      disabled={isDeleting}
                      title="Delete Quiz"
                      style={{
                        padding: '6px 10px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '6px',
                        color: '#DC2626',
                        fontSize: '12px',
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quiz Form Modal (Create / Edit) */}
      {formOpen && (
        <QuizFormModal
          courseId={courseId}
          quizToEdit={editingQuiz}
          onClose={() => {
            setFormOpen(false)
            setEditingQuiz(undefined)
          }}
        />
      )}

      {/* Quiz Results Modal */}
      {resultsQuiz && (
        <QuizResultsModal
          quiz={resultsQuiz}
          attempts={resultsQuiz.attempts ?? []}
          onClose={() => setResultsQuiz(null)}
        />
      )}
    </div>
  )
}
