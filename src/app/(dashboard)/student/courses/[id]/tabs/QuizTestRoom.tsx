'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Quiz, QuizQuestion, QuizAttempt } from '@/types/database'

interface QuizWithDetails extends Quiz {
  questions?: QuizQuestion[]
}

interface QuizTestRoomProps {
  quiz: QuizWithDetails
  courseId: string
  userId: string
  existingAttempt?: QuizAttempt
  onExit: () => void
}

// ── Shuffle utilities ────────────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function QuizTestRoom({ quiz, courseId: _courseId, userId, existingAttempt, onExit }: QuizTestRoomProps) {
  const router = useRouter()
  const supabase = createClient()

  // If viewing a previous attempt review
  const isReviewMode = !!existingAttempt && !!existingAttempt.submitted_at

  // 1. Prepare questions (apply pool sampling & shuffling)
  const preparedQuestions = useMemo(() => {
    let list = quiz.questions ? [...quiz.questions] : []

    // If review mode, reconstruct question order if stored or keep original
    if (isReviewMode) {
      return list
    }

    if (quiz.shuffle_questions) {
      list = shuffleArray(list)
    }

    if (quiz.questions_to_answer && quiz.questions_to_answer > 0 && quiz.questions_to_answer < list.length) {
      list = list.slice(0, quiz.questions_to_answer)
    }

    if (quiz.shuffle_options) {
      list = list.map((q) => {
        if (q.question_type === 'multiple_choice' && q.options && q.options.length > 1) {
          return {
            ...q,
            options: shuffleArray(q.options),
          }
        }
        return q
      })
    }

    return list
  }, [quiz, isReviewMode])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (existingAttempt?.answers && typeof existingAttempt.answers === 'object') {
      return existingAttempt.answers as Record<string, string>
    }
    return {}
  })
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [attemptResult, setAttemptResult] = useState<QuizAttempt | null>(existingAttempt ?? null)

  // ── Live Countdown Timer Engine ─────────────────────────────────────────────
  const totalSeconds = (quiz.duration_minutes || 15) * 60
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasAutoSubmitted = useRef(false)

  const answersRef = useRef(answers)
  answersRef.current = answers

  const handleFinalSubmitRef = useRef<(isAuto?: boolean) => Promise<void>>(async () => {})

  useEffect(() => {
    if (isReviewMode || attemptResult) return

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true
            handleFinalSubmitRef.current(true)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isReviewMode, attemptResult])

  // ── Format Timer (MM:SS) ───────────────────────────────────────────────────
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const isLowTime = secondsRemaining <= 120 && secondsRemaining > 0 && !isReviewMode && !attemptResult

  // ── Grading & Submission logic ──────────────────────────────────────────────
  const handleFinalSubmit = async (isAuto = false) => {
    if (submitting || attemptResult) return
    setSubmitting(true)

    try {
      const currentAns = answersRef.current
      let totalEarned = 0
      let maxPoints = 0

      for (const q of preparedQuestions) {
        const qPoints = q.points || 1
        maxPoints += qPoints
        const studentAns = currentAns[q.id]
        if (studentAns && studentAns.trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase()) {
          totalEarned += qPoints
        }
      }

      const pct = maxPoints > 0 ? (totalEarned / maxPoints) * 100 : 0
      const passed = pct >= (quiz.passing_score || 50)

      // Persist attempt into Supabase
      const payload = {
        quiz_id: quiz.id,
        student_id: userId,
        started_at: new Date(Date.now() - (totalSeconds - secondsRemaining) * 1000).toISOString(),
        submitted_at: new Date().toISOString(),
        score: totalEarned,
        total_points: maxPoints,
        percentage: pct,
        passed,
        answers: currentAns,
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('quiz_attempts')
        .insert(payload as never)
        .select('*')
        .single<QuizAttempt>()

      if (insertErr) {
        console.error('Error recording quiz attempt:', insertErr)
      }

      setAttemptResult(inserted ?? (payload as unknown as QuizAttempt))
      setShowSubmitModal(false)
      router.refresh()
    } catch (err) {
      console.error('Submission failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  handleFinalSubmitRef.current = handleFinalSubmit

  const currentQ = preparedQuestions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const totalQCount = preparedQuestions.length

  // ── Result Summary View ────────────────────────────────────────────────────
  if (attemptResult) {
    return (
      <div style={{ animation: 'tabFadeIn 250ms ease', maxWidth: '880px', margin: '0 auto' }}>
        {/* Top Header Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: attemptResult.passed ? '#ECFDF5' : '#FEF2F2',
            border: `2px solid ${attemptResult.passed ? '#A7F3D0' : '#FECACA'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}>
            {attemptResult.passed ? '🎉' : '📝'}
          </div>

          <span style={{
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '700',
            background: attemptResult.passed ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${attemptResult.passed ? '#A7F3D0' : '#FECACA'}`,
            color: attemptResult.passed ? '#059669' : '#DC2626',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            {attemptResult.passed ? 'Exam Passed' : 'Needs Improvement'}
          </span>

          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', marginTop: '12px', marginBottom: '6px' }}>
            {quiz.title}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 24px' }}>
            Submitted on {new Date(attemptResult.submitted_at ?? '').toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>

          {/* Score Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '14px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Score</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>
                {attemptResult.score} / {attemptResult.total_points}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Percentage</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: attemptResult.passed ? '#059669' : '#DC2626', marginTop: '4px' }}>
                {Math.round(attemptResult.percentage || 0)}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Passing Requirement</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>
                {quiz.passing_score}%
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="btn-primary"
            style={{ padding: '10px 28px', fontSize: '14px' }}
          >
            ← Return to Quizzes
          </button>
        </div>

        {/* Detailed Solutions Breakdown */}
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
          Detailed Review & Correct Answers
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {preparedQuestions.map((q, idx) => {
            const studentAns = (attemptResult.answers as Record<string, string>)?.[q.id]
            const isCorrect = studentAns && studentAns.trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase()

            return (
              <div
                key={q.id}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${isCorrect ? '#A7F3D0' : '#FECACA'}`,
                  borderRadius: '12px',
                  padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: isCorrect ? '#ECFDF5' : '#FEF2F2',
                      color: isCorrect ? '#059669' : '#DC2626',
                    }}>
                      Question {idx + 1}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      {q.points || 1} pt{q.points !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: isCorrect ? '#059669' : '#DC2626',
                  }}>
                    {isCorrect ? '✓ Correct (+ ' + (q.points || 1) + ')' : '✗ Incorrect (0 pts)'}
                  </span>
                </div>

                <p style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', lineHeight: 1.4, marginBottom: '14px' }}>
                  {q.question_text}
                </p>

                {/* Choices breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options?.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx)
                    const isStudentChoice = studentAns === opt
                    const isRightAnswer = q.correct_answer === opt

                    let bg = '#F8FAFC'
                    let border = '#E2E8F0'
                    let textCol = '#334155'

                    if (isRightAnswer) {
                      bg = '#ECFDF5'
                      border = '#A7F3D0'
                      textCol = '#065F46'
                    } else if (isStudentChoice && !isCorrect) {
                      bg = '#FEF2F2'
                      border = '#FECACA'
                      textCol = '#991B1B'
                    }

                    return (
                      <div
                        key={oIdx}
                        style={{
                          padding: '10px 14px',
                          background: bg,
                          border: `1px solid ${border}`,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          color: textCol,
                          fontWeight: isRightAnswer || isStudentChoice ? '600' : '400',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700' }}>{letter}.</span>
                          <span>{opt}</span>
                        </div>
                        {isRightAnswer && (
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#D1FAE5', padding: '2px 8px', borderRadius: '4px' }}>
                            ✓ Correct Answer
                          </span>
                        )}
                        {isStudentChoice && !isRightAnswer && (
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#DC2626', background: '#FEE2E2', padding: '2px 8px', borderRadius: '4px' }}>
                            Your Answer
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Active Live Testing Exam Room ──────────────────────────────────────────
  return (
    <div style={{ animation: 'tabFadeIn 200ms ease' }}>
      {/* Sticky Deep Navy Header & Live Countdown Bar */}
      <div style={{
        position: 'sticky',
        top: '64px',
        zIndex: 40,
        background: '#1B2559',
        borderRadius: '12px',
        padding: '14px 20px',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(27, 37, 89, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onExit}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            ← Exit Test
          </button>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
              {quiz.title}
            </h2>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
              Question {currentIndex + 1} of {totalQCount} · {answeredCount} Answered
            </span>
          </div>
        </div>

        {/* Live Countdown Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            background: isLowTime ? '#EF4444' : 'rgba(255,255,255,0.15)',
            borderRadius: '8px',
            fontWeight: '800',
            fontSize: '16px',
            letterSpacing: '0.04em',
            fontFamily: 'monospace',
            animation: isLowTime ? 'pulse 1s infinite' : 'none',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            style={{
              padding: '8px 18px',
              background: '#2563EB',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
            }}
          >
            Finish & Submit
          </button>
        </div>
      </div>

      {/* Main Examination Layout: Question Workspace + Palette Navigator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
        {/* Left: Active Question Card */}
        {currentQ ? (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '28px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            {/* Question Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  padding: '4px 10px',
                  background: '#1B2559',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                }}>
                  Question {currentIndex + 1}
                </span>
                <span style={{ fontSize: '13px', color: '#64748B' }}>
                  Worth {currentQ.points || 1} mark{currentQ.points !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Flag button */}
              <button
                type="button"
                onClick={() => setFlagged((f) => ({ ...f, [currentQ.id]: !f[currentQ.id] }))}
                style={{
                  padding: '6px 12px',
                  background: flagged[currentQ.id] ? '#FFFBEB' : '#F8FAFC',
                  border: `1px solid ${flagged[currentQ.id] ? '#FDE68A' : '#CBD5E1'}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: flagged[currentQ.id] ? '#D97706' : '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🚩</span>
                {flagged[currentQ.id] ? 'Flagged for Review' : 'Flag for Review'}
              </button>
            </div>

            {/* Question Text */}
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', lineHeight: 1.5 }}>
              {currentQ.question_text}
            </div>

            {/* Answer Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentQ.options?.map((opt, oIdx) => {
                const letter = String.fromCharCode(65 + oIdx)
                const isSelected = answers[currentQ.id] === opt

                return (
                  <div
                    key={oIdx}
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }))}
                    style={{
                      padding: '14px 18px',
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      border: `1.5px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = '#CBD5E1'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = '#E2E8F0'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isSelected ? '#2563EB' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {letter}
                    </div>
                    <span style={{ fontSize: '14px', color: isSelected ? '#1E40AF' : '#0F172A', fontWeight: isSelected ? '600' : '400' }}>
                      {opt}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Bottom Actions Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '18px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                disabled={currentIndex === 0}
                style={{
                  padding: '9px 18px',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex === 0 ? 0.5 : 1,
                }}
              >
                ← Previous
              </button>

              {answers[currentQ.id] && (
                <button
                  type="button"
                  onClick={() => {
                    const copy = { ...answers }
                    delete copy[currentQ.id]
                    setAnswers(copy)
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Clear Selection
                </button>
              )}

              {currentIndex < totalQCount - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((idx) => Math.min(totalQCount - 1, idx + 1))}
                  className="btn-primary"
                  style={{ padding: '9px 20px', fontSize: '13px' }}
                >
                  Next Question ➜
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  style={{
                    padding: '9px 22px',
                    background: '#059669',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Submit Exam ➜
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Right: Question Navigator Palette */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '12px' }}>
            Question Palette
          </h3>

          {/* Palette Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '18px' }}>
            {preparedQuestions.map((q, idx) => {
              const isCurrent = currentIndex === idx
              const isAnswered = !!answers[q.id]
              const isFlag = !!flagged[q.id]

              let bg = '#F8FAFC'
              let border = '#CBD5E1'
              let text = '#475569'

              if (isCurrent) {
                border = '#1B2559'
                text = '#1B2559'
              }
              if (isAnswered) {
                bg = '#ECFDF5'
                border = '#059669'
                text = '#059669'
              }
              if (isFlag) {
                bg = '#FFFBEB'
                border = '#D97706'
                text = '#D97706'
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    background: bg,
                    border: `1.5px solid ${border}`,
                    color: text,
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isCurrent ? '0 0 0 2px #BFDBFE' : 'none',
                  }}
                >
                  <span>{idx + 1}</span>
                  {isFlag && <span style={{ fontSize: '8px', marginTop: '-2px' }}>🚩</span>}
                </button>
              )
            })}
          </div>

          {/* Palette Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ECFDF5', border: '1px solid #059669' }} />
              <span>Answered ({answeredCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F8FAFC', border: '1px solid #CBD5E1' }} />
              <span>Unanswered ({totalQCount - answeredCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#FFFBEB', border: '1px solid #D97706' }} />
              <span>Flagged ({Object.values(flagged).filter(Boolean).length})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              background: '#EFF6FF',
              borderRadius: '50%',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              📋
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
              Ready to submit your CBT exam?
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, marginBottom: '20px' }}>
              You have answered <strong>{answeredCount} of {totalQCount}</strong> questions.
              {totalQCount - answeredCount > 0 && (
                <span style={{ color: '#DC2626', display: 'block', marginTop: '6px', fontWeight: '600' }}>
                  ⚠️ You still have {totalQCount - answeredCount} unanswered question(s)!
                </span>
              )}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                style={{
                  padding: '9px 18px',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Back to Exam
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
                className="btn-primary"
                style={{
                  padding: '9px 24px',
                  fontSize: '13px',
                  background: '#059669',
                }}
              >
                {submitting ? 'Submitting & Grading…' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
