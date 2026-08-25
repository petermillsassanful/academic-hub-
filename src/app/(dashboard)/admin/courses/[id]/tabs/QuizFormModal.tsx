'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { BulkQuestionImportModal } from './BulkQuestionImportModal'
import { createCourseNotification } from '@/lib/notifications'
import type { Quiz, QuizQuestion, QuestionType } from '@/types/database'

export interface EditableQuestion {
  id?: string
  question_text: string
  question_type: QuestionType
  points: number
  options: string[]
  correct_answer: string
}

interface QuizFormModalProps {
  courseId: string
  quizToEdit?: Quiz & { questions?: QuizQuestion[] }
  onClose: () => void
}

export function QuizFormModal({ courseId, quizToEdit, onClose }: QuizFormModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  const [title, setTitle] = useState(quizToEdit?.title ?? '')
  const [description, setDescription] = useState(quizToEdit?.description ?? '')
  const [durationMinutes, setDurationMinutes] = useState(quizToEdit?.duration_minutes ?? 15)
  const [passingScore, setPassingScore] = useState(quizToEdit?.passing_score ?? 50)
  const [questionsToAnswer, setQuestionsToAnswer] = useState<string>(
    quizToEdit?.questions_to_answer ? String(quizToEdit.questions_to_answer) : ''
  )
  const [shuffleQuestions, setShuffleQuestions] = useState(quizToEdit?.shuffle_questions ?? true)
  const [shuffleOptions, setShuffleOptions] = useState(quizToEdit?.shuffle_options ?? true)
  const [dueDate, setDueDate] = useState(
    quizToEdit?.due_date
      ? new Date(quizToEdit.due_date).toISOString().slice(0, 16)
      : ''
  )

  const [questions, setQuestions] = useState<EditableQuestion[]>(
    quizToEdit?.questions && quizToEdit.questions.length > 0
      ? quizToEdit.questions.map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          points: q.points,
          options: q.options && q.options.length > 0 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
          correct_answer: q.correct_answer,
        }))
      : [
          {
            question_text: '',
            question_type: 'multiple_choice',
            points: 1,
            options: ['', '', '', ''],
            correct_answer: '',
          },
        ]
  )

  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    color: '#0F172A',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 150ms',
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: '',
        question_type: 'multiple_choice',
        points: 1,
        options: ['', '', '', ''],
        correct_answer: '',
      },
    ])
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) {
      setError('A quiz must have at least one question in the bank.')
      return
    }
    setError(null)
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  function updateQuestion(index: number, updates: Partial<EditableQuestion>) {
    setQuestions((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...updates }
      return copy
    })
  }

  function updateOption(qIndex: number, optIndex: number, text: string) {
    setQuestions((prev) => {
      const copy = [...prev]
      const currentOpts = [...copy[qIndex].options]
      const oldOptVal = currentOpts[optIndex]
      currentOpts[optIndex] = text
      copy[qIndex].options = currentOpts

      if (copy[qIndex].correct_answer === oldOptVal) {
        copy[qIndex].correct_answer = text
      }
      return copy
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Quiz title is required')
      setActiveTab('settings')
      return
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question_text.trim()) {
        setError(`Question #${i + 1} is missing question text`)
        setActiveTab('questions')
        return
      }
      if (q.question_type === 'multiple_choice') {
        const nonEmpty = q.options.filter((o) => o.trim().length > 0)
        if (nonEmpty.length < 2) {
          setError(`Question #${i + 1} must have at least 2 choices`)
          setActiveTab('questions')
          return
        }
        if (!q.correct_answer || !q.correct_answer.trim()) {
          setError(`Please select the correct answer for Question #${i + 1}`)
          setActiveTab('questions')
          return
        }
      } else if (q.question_type === 'true_false') {
        if (!q.correct_answer) {
          setError(`Please choose True or False for Question #${i + 1}`)
          setActiveTab('questions')
          return
        }
      }
    }

    setError(null)
    setLoading(true)

    try {
      const quizPayload = {
        course_id: courseId,
        title: title.trim(),
        description: description.trim() || null,
        duration_minutes: Number(durationMinutes) || 15,
        passing_score: Number(passingScore) || 50,
        questions_to_answer: questionsToAnswer ? parseInt(questionsToAnswer) : null,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      }

      let quizId = quizToEdit?.id

      if (quizId) {
        const { error: qErr } = await supabase
          .from('quizzes')
          .update(quizPayload as never)
          .eq('id', quizId)

        if (qErr) throw qErr
        await supabase.from('quiz_questions').delete().eq('quiz_id', quizId)
      } else {
        const { data: newQuiz, error: qErr } = await supabase
          .from('quizzes')
          .insert(quizPayload as never)
          .select('id')
          .single<{ id: string }>()

        if (qErr || !newQuiz) throw qErr || new Error('Failed to create quiz')
        quizId = newQuiz.id
      }

      const questionsToInsert = questions.map((q, idx) => ({
        quiz_id: quizId,
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        points: q.points || 1,
        options: q.question_type === 'multiple_choice' ? q.options.map((o) => o.trim()).filter(Boolean) : ['True', 'False'],
        correct_answer: q.correct_answer.trim(),
        order_index: idx,
      }))

      const { error: insErr } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert as never)

      if (insErr) throw insErr

      // Send notification to all enrolled students
      await createCourseNotification({
        courseId,
        title: 'New CBT Quiz Available',
        message: `CBT Quiz '${title.trim()}' (${questions.length} questions, ${durationMinutes} mins) is now available. Passing mark: ${passingScore}%.`,
        type: 'quiz',
        link: `/student/courses/${courseId}?tab=quizzes`,
      })

      router.refresh()
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while saving the quiz'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={quizToEdit ? 'Edit Quiz & Question Bank' : 'Create New Timed Quiz / CBT'}
      maxWidth={720}
    >
      {/* Sub tabs inside modal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', marginBottom: '20px', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '7px 14px',
              background: activeTab === 'settings' ? '#EFF6FF' : 'transparent',
              border: activeTab === 'settings' ? '1px solid #BFDBFE' : '1px solid transparent',
              borderRadius: '8px',
              color: activeTab === 'settings' ? '#1D4ED8' : '#64748B',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            ⚙️ 1. Settings & Timer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            style={{
              padding: '7px 14px',
              background: activeTab === 'questions' ? '#EFF6FF' : 'transparent',
              border: activeTab === 'questions' ? '1px solid #BFDBFE' : '1px solid transparent',
              borderRadius: '8px',
              color: activeTab === 'questions' ? '#1D4ED8' : '#64748B',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📝 2. Question Bank ({questions.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setBulkModalOpen(true)}
          style={{
            padding: '6px 12px',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            color: '#059669',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#D1FAE5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ECFDF5'
          }}
        >
          📥 Bulk Import Document / Text
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Tab 1: Settings */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Quiz Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mid-Term Computer-Based Test (CBT)"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#2563EB')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
              />
            </div>

            <div>
              <label style={labelStyle}>Instructions / Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter guidelines for students (e.g. Attempt all questions, timer starts immediately upon clicking start…)"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#2563EB')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
              />
            </div>

            {/* Duration and Passing Score */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>⏱️ Duration (Minutes) *</label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
                />
              </div>
              <div>
                <label style={labelStyle}>🎯 Passing Score (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(Math.max(1, parseInt(e.target.value) || 50))}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
                />
              </div>
            </div>

            {/* Question Pool Sampling & Deadline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>
                  🎲 Questions Per Student
                  <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '4px' }}>(Leave empty for all)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={questionsToAnswer}
                  onChange={(e) => setQuestionsToAnswer(e.target.value)}
                  placeholder="e.g. 10 (random from pool)"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
                />
              </div>
              <div>
                <label style={labelStyle}>📅 Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
                />
              </div>
            </div>

            {/* Randomization Toggles */}
            <div style={{
              padding: '14px 16px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1E293B', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#2563EB' }}
                />
                <span><strong>🔀 Shuffle Question Order per student</strong> (Student A gets Q1 as Q5)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1E293B', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#2563EB' }}
                />
                <span><strong>🔀 Shuffle Answer Options (A, B, C, D)</strong> per student</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Question Bank */}
        {activeTab === 'questions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                style={{
                  padding: '16px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Header: Question Number, Type & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '3px 8px',
                      background: '#1B2559',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#FFFFFF',
                    }}>
                      Q{qIdx + 1}
                    </span>
                    <select
                      value={q.question_type}
                      onChange={(e) => {
                        const newType = e.target.value as QuestionType
                        updateQuestion(qIdx, {
                          question_type: newType,
                          options: newType === 'true_false' ? ['True', 'False'] : ['', '', '', ''],
                          correct_answer: newType === 'true_false' ? 'True' : '',
                        })
                      }}
                      style={{
                        padding: '4px 10px',
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        color: '#0F172A',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    >
                      <option value="multiple_choice">Multiple Choice (MCQ)</option>
                      <option value="true_false">True / False</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>Points:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={q.points}
                        onChange={(e) => updateQuestion(qIdx, { points: Math.max(1, parseInt(e.target.value) || 1) })}
                        style={{
                          width: '45px',
                          padding: '3px 6px',
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          color: '#0F172A',
                          fontSize: '12px',
                          textAlign: 'center',
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      title="Delete Question"
                      style={{
                        padding: '4px 8px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '6px',
                        color: '#DC2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <input
                  type="text"
                  value={q.question_text}
                  onChange={(e) => updateQuestion(qIdx, { question_text: e.target.value })}
                  placeholder="Enter the question statement here…"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
                />

                {/* Options / Choices */}
                {q.question_type === 'multiple_choice' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Options (Select the correct answer radio button):
                    </span>
                    {q.options.map((opt, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx)
                      const isCorrect = q.correct_answer === opt && opt.trim().length > 0
                      return (
                        <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name={`correct-ans-${qIdx}`}
                            checked={isCorrect}
                            onChange={() => updateQuestion(qIdx, { correct_answer: opt })}
                            title="Mark as correct answer"
                            style={{ width: '16px', height: '16px', accentColor: '#059669', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: '700', color: isCorrect ? '#059669' : '#64748B', width: '16px' }}>
                            {letter}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${letter}`}
                            style={{
                              ...inputStyle,
                              padding: '8px 10px',
                              fontSize: '13px',
                              borderColor: isCorrect ? '#059669' : '#CBD5E1',
                              background: isCorrect ? '#ECFDF5' : '#FFFFFF',
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>Select Correct Answer:</span>
                    {['True', 'False'].map((val) => (
                      <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0F172A', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`tf-ans-${qIdx}`}
                          checked={q.correct_answer === val}
                          onChange={() => updateQuestion(qIdx, { correct_answer: val })}
                          style={{ width: '15px', height: '15px', accentColor: '#059669' }}
                        />
                        {val}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={addQuestion}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#EFF6FF',
                  border: '1px dashed #93C5FD',
                  borderRadius: '10px',
                  color: '#1D4ED8',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#DBEAFE'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#EFF6FF'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                + Add Single Question
              </button>

              <button
                type="button"
                onClick={() => setBulkModalOpen(true)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#ECFDF5',
                  border: '1px dashed #A7F3D0',
                  borderRadius: '10px',
                  color: '#059669',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#D1FAE5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ECFDF5'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                📥 Bulk Import (10 - 100+ Questions)
              </button>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#DC2626',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* Modal footer buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid #E2E8F0' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              color: '#64748B',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>

          {activeTab === 'settings' ? (
            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className="btn-primary"
              style={{
                padding: '9px 20px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Continue to Questions ➜
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                padding: '9px 24px',
                fontSize: '14px',
              }}
            >
              {loading ? 'Saving Quiz…' : quizToEdit ? 'Save Changes' : 'Create Quiz & Pool'}
            </button>
          )}
        </div>
      </form>

      {/* Bulk Import Modal */}
      {bulkModalOpen && (
        <BulkQuestionImportModal
          isOpen={bulkModalOpen}
          onClose={() => setBulkModalOpen(false)}
          onImport={(imported) => {
            setQuestions((prev) => {
              const isOnlyOneEmpty =
                prev.length === 1 &&
                !prev[0].question_text.trim() &&
                prev[0].options.every((o) => !o.trim())

              return isOnlyOneEmpty ? imported : [...prev, ...imported]
            })
            setActiveTab('questions')
          }}
        />
      )}
    </Modal>
  )
}
