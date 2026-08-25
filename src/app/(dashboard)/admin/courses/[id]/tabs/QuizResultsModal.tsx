'use client'

import { Modal } from '@/components/ui/Modal'
import type { Quiz, QuizAttempt, Profile } from '@/types/database'

export interface AttemptWithStudent extends QuizAttempt {
  student?: Profile
}

export type QuizAttemptWithStudent = AttemptWithStudent

export interface QuizResultsModalProps {
  quiz: Quiz
  attempts: AttemptWithStudent[]
  isOpen?: boolean
  onClose: () => void
}

export function QuizResultsModal({ quiz, attempts, isOpen = true, onClose }: QuizResultsModalProps) {
  const completedAttempts = attempts.filter((a) => a.submitted_at)
  const averageScore = completedAttempts.length > 0
    ? Math.round(completedAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / completedAttempts.length)
    : 0

  const passedCount = completedAttempts.filter((a) => a.passed).length
  const passRate = completedAttempts.length > 0
    ? Math.round((passedCount / completedAttempts.length) * 100)
    : 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`CBT Results: ${quiz.title}`}
      maxWidth={760}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Quick summary stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
        }}>
          <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Total Attempts</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{attempts.length}</span>
          </div>

          <div style={{ padding: '14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#1D4ED8', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Avg Score</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#1D4ED8' }}>{averageScore}%</span>
          </div>

          <div style={{ padding: '14px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#065F46', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Pass Rate</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>{passRate}%</span>
          </div>

          <div style={{ padding: '14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#92400E', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Passing Mark</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#D97706' }}>{quiz.passing_score}%</span>
          </div>
        </div>

        {/* Attempts Table */}
        {attempts.length === 0 ? (
          <div style={{
            padding: '36px',
            textAlign: 'center',
            background: '#F8FAFC',
            borderRadius: '12px',
            border: '1px dashed #CBD5E1',
            color: '#64748B',
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>No student attempts recorded for this quiz yet.</p>
          </div>
        ) : (
          <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 14px', color: '#475569', fontWeight: '700' }}>Student</th>
                  <th style={{ padding: '10px 14px', color: '#475569', fontWeight: '700' }}>Index / Email</th>
                  <th style={{ padding: '10px 14px', color: '#475569', fontWeight: '700' }}>Score</th>
                  <th style={{ padding: '10px 14px', color: '#475569', fontWeight: '700' }}>Percentage</th>
                  <th style={{ padding: '10px 14px', color: '#475569', fontWeight: '700' }}>Status</th>
                  <th style={{ padding: '10px 14px', color: '#475569', fontWeight: '700' }}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => {
                  const studentName = attempt.student?.full_name || 'Anonymous Student'
                  const studentIdent = attempt.student?.index_number || attempt.student?.email || '—'
                  const isPassed = attempt.passed

                  return (
                    <tr key={attempt.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 150ms ease' }}>
                      <td style={{ padding: '12px 14px', color: '#0F172A', fontWeight: '600' }}>{studentName}</td>
                      <td style={{ padding: '12px 14px', color: '#64748B' }}>{studentIdent}</td>
                      <td style={{ padding: '12px 14px', color: '#0F172A', fontWeight: '700' }}>
                        {attempt.score ?? 0} / {attempt.total_points ?? 0}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: isPassed ? '#059669' : '#DC2626' }}>
                        {attempt.percentage ?? 0}%
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: isPassed ? '#ECFDF5' : '#FEF2F2',
                          color: isPassed ? '#059669' : '#DC2626',
                          border: `1px solid ${isPassed ? '#A7F3D0' : '#FECACA'}`,
                        }}>
                          {isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '12px' }}>
                        {attempt.submitted_at
                          ? new Date(attempt.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : 'In Progress'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
