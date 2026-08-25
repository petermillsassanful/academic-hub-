'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Quiz, QuizQuestion, QuizAttempt } from '@/types/database'

interface QuizWithDetails extends Quiz {
  questions?: QuizQuestion[]
}

interface StudentQuizzesTabProps {
  quizzes: QuizWithDetails[]
  attempts: QuizAttempt[]
  courseId: string
  userId: string
  onSelectQuizToTake: (quiz: QuizWithDetails, latestAttempt?: QuizAttempt) => void
}

export function StudentQuizzesTab({
  quizzes,
  attempts,
  courseId: _courseId,
  userId: _userId,
  onSelectQuizToTake,
}: StudentQuizzesTabProps) {
  const router = useRouter()
  const attemptsByQuiz = new Map<string, QuizAttempt[]>()
  for (const att of attempts) {
    const list = attemptsByQuiz.get(att.quiz_id) ?? []
    list.push(att)
    attemptsByQuiz.set(att.quiz_id, list)
  }

  if (quizzes.length === 0) {
    return (
      <div style={{
        padding: '48px 30px', textAlign: 'center',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0', borderRadius: '12px',
        animation: 'tabFadeIn 200ms ease',
      }}>
        <div style={{
          width: '48px', height: '48px', margin: '0 auto 12px',
          background: '#EFF6FF', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <p style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>No quizzes available</p>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
          Your lecturer has not published any quizzes or CBT tests for this course yet.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'tabFadeIn 200ms ease' }}>
      {quizzes.map((quiz) => {
        const quizAttempts = attemptsByQuiz.get(quiz.id) ?? []
        // Get the latest completed or in-progress attempt
        const latestAttempt = quizAttempts[quizAttempts.length - 1]
        const hasCompleted = latestAttempt && latestAttempt.submitted_at
        const totalQuestions = quiz.questions?.length ?? 0
        const displayQCount = quiz.questions_to_answer ? Math.min(quiz.questions_to_answer, totalQuestions) : totalQuestions

        const isPastDue = quiz.due_date ? new Date(quiz.due_date).getTime() < Date.now() : false

        return (
          <div
            key={quiz.id}
            style={{
              padding: '22px 26px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    padding: '3px 9px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#1D4ED8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    CBT Exam
                  </span>
                  {hasCompleted ? (
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: latestAttempt.passed ? '#ECFDF5' : '#FEF2F2',
                      border: `1px solid ${latestAttempt.passed ? '#A7F3D0' : '#FECACA'}`,
                      color: latestAttempt.passed ? '#059669' : '#DC2626',
                    }}>
                      {latestAttempt.passed ? '✓ Passed' : '✗ Failed'} ({Math.round(latestAttempt.percentage || 0)}%)
                    </span>
                  ) : isPastDue ? (
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                    }}>
                      ⏰ Closed (Past Due)
                    </span>
                  ) : (
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#475569',
                    }}>
                      Available
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginBottom: '6px', lineHeight: 1.3 }}>
                  {quiz.title}
                </h3>

                {quiz.description && (
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 10px' }}>
                    {quiz.description}
                  </p>
                )}

                {/* Metadata Chips */}
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12px', color: '#64748B' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    ⏱️ <strong>{quiz.duration_minutes} Mins</strong>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    📝 <strong>{displayQCount} Questions</strong>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    🎯 Pass: <strong>{quiz.passing_score}%</strong>
                  </span>
                  {quiz.due_date && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: isPastDue ? '#DC2626' : '#64748B', fontWeight: isPastDue ? '600' : '400' }}>
                      📅 Due: {new Date(quiz.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button & Score Pill */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                {hasCompleted ? (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: latestAttempt.passed ? '#059669' : '#DC2626' }}>
                      {latestAttempt.score} / {latestAttempt.total_points}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectQuizToTake(quiz, latestAttempt)}
                      style={{
                        marginTop: '6px',
                        padding: '7px 14px',
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      Review Answers & Feedback ➜
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isPastDue}
                    onClick={() => onSelectQuizToTake(quiz)}
                    className="btn-primary"
                    style={{
                      padding: '10px 22px',
                      fontSize: '14px',
                      opacity: isPastDue ? 0.6 : 1,
                      cursor: isPastDue ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Start CBT Exam ➜
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
