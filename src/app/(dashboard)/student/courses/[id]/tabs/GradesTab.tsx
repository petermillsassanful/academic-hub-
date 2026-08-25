import type { Submission, Assignment, QuizAttempt, Quiz } from '@/types/database'

interface GradeWithAssignment extends Submission {
  assignments: Pick<Assignment, 'title' | 'max_score'>
}

export interface QuizGradeWithQuiz extends QuizAttempt {
  quizzes?: Pick<Quiz, 'title'>
}

interface GradesTabProps {
  grades: GradeWithAssignment[]
  quizGrades?: QuizGradeWithQuiz[]
}

export function GradesTab({ grades, quizGrades = [] }: GradesTabProps) {
  const totalItems = grades.length + quizGrades.length

  if (totalItems === 0) {
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
            <circle cx="12" cy="8" r="6"/>
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
        </div>
        <p style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>No grades yet</p>
        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
          Grades and feedback will appear here once your lecturer reviews submissions or you complete CBT tests.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'tabFadeIn 200ms ease' }}>
      {/* CBT Quizzes Section if any */}
      {quizGrades.length > 0 && (
        <>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '4px 0 0' }}>
            CBT Exam & Quiz Scores
          </h3>
          {quizGrades.map((qg) => {
            const pct = Math.round(qg.percentage || 0)
            const pctColor = qg.passed ? '#059669' : '#DC2626'
            const pctBg = qg.passed ? '#ECFDF5' : '#FEF2F2'
            const pctBorder = qg.passed ? '#A7F3D0' : '#FECACA'

            return (
              <div key={qg.id} style={{
                padding: '20px 24px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0', borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '700',
                        background: '#EFF6FF', color: '#1D4ED8', textTransform: 'uppercase',
                      }}>
                        CBT Test
                      </span>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                        {qg.quizzes?.title ?? 'CBT Quiz'}
                      </p>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                      Completed {new Date(qg.submitted_at ?? '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', lineHeight: 1, margin: 0 }}>
                      {qg.score}
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748B' }}> / {qg.total_points}</span>
                    </p>
                    <span style={{
                      display: 'inline-block', marginTop: '6px',
                      padding: '3px 9px', borderRadius: '6px',
                      fontSize: '12px', fontWeight: '700', color: pctColor,
                      background: pctBg,
                      border: `1px solid ${pctBorder}`,
                    }}>
                      {qg.passed ? '✓ Passed ' : '✗ Failed '} ({pct}%)
                    </span>
                  </div>
                </div>

                {/* Score progress bar */}
                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: qg.passed ? '#10B981' : '#EF4444',
                    borderRadius: '99px', transition: 'width 600ms ease',
                  }} />
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Assignments Section if any */}
      {grades.length > 0 && (
        <>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: quizGrades.length > 0 ? '16px 0 0' : '4px 0 0' }}>
            Assignment Grades & Feedback
          </h3>
          {grades.map((g) => {
            const pct = Math.round((g.grade! / g.assignments.max_score) * 100)
            const pctColor = pct >= 70 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626'
            const pctBg = pct >= 70 ? '#ECFDF5' : pct >= 50 ? '#FFFBEB' : '#FEF2F2'
            const pctBorder = pct >= 70 ? '#A7F3D0' : pct >= 50 ? '#FDE68A' : '#FECACA'

            return (
              <div key={g.id} style={{
                padding: '20px 24px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0', borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
                      {g.assignments.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                      Graded {new Date(g.graded_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', lineHeight: 1, margin: 0 }}>
                      {g.grade}
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748B' }}> / {g.assignments.max_score}</span>
                    </p>
                    <span style={{
                      display: 'inline-block', marginTop: '6px',
                      padding: '3px 9px', borderRadius: '6px',
                      fontSize: '12px', fontWeight: '700', color: pctColor,
                      background: pctBg,
                      border: `1px solid ${pctBorder}`,
                    }}>
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Score progress bar */}
                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden', marginBottom: g.feedback ? '14px' : '0' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444',
                    borderRadius: '99px', transition: 'width 600ms ease',
                  }} />
                </div>

                {g.feedback && (
                  <div style={{
                    padding: '12px 16px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0', borderRadius: '8px',
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                      Lecturer Feedback
                    </p>
                    <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {g.feedback}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
