import type { Submission, Assignment } from '@/types/database'

interface GradeWithAssignment extends Submission {
  assignments: Pick<Assignment, 'title' | 'max_score'>
}

interface GradesTabProps {
  grades: GradeWithAssignment[]
}

export function GradesTab({ grades }: GradesTabProps) {
  if (grades.length === 0) {
    return (
      <div style={{
        padding: '50px 30px', textAlign: 'center',
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed #1E293B', borderRadius: '12px',
        animation: 'tabFadeIn 200ms ease',
      }}>
        <div style={{
          width: '48px', height: '48px', margin: '0 auto 14px',
          background: 'rgba(16,185,129,0.08)', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5">
            <circle cx="12" cy="8" r="6"/>
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
        </div>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '6px' }}>No grades yet</p>
        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
          Grades will appear here once your lecturer reviews your submissions.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'tabFadeIn 200ms ease' }}>
      {grades.map((g) => {
        const pct = Math.round((g.grade! / g.assignments.max_score) * 100)
        const pctColor = pct >= 70 ? '#6EE7B7' : pct >= 50 ? '#FCD34D' : '#FCA5A5'

        return (
          <div key={g.id} style={{
            padding: '20px 24px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid #1E293B', borderRadius: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px' }}>
                  {g.assignments.title}
                </p>
                <p style={{ fontSize: '12px', color: '#475569' }}>
                  Graded {new Date(g.graded_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '26px', fontWeight: '800', color: '#FFFFFF', lineHeight: 1 }}>
                  {g.grade}
                  <span style={{ fontSize: '14px', fontWeight: '400', color: '#475569' }}>/{g.assignments.max_score}</span>
                </p>
                <span style={{
                  display: 'inline-block', marginTop: '4px',
                  padding: '2px 8px', borderRadius: '99px',
                  fontSize: '12px', fontWeight: '700', color: pctColor,
                  background: `${pctColor}18`,
                  border: `1px solid ${pctColor}40`,
                }}>
                  {pct}%
                </span>
              </div>
            </div>

            {/* Score bar */}
            <div style={{ height: '5px', background: '#1E293B', borderRadius: '99px', overflow: 'hidden', marginBottom: g.feedback ? '12px' : '0' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: pct >= 70 ? 'linear-gradient(90deg,#059669,#6EE7B7)' : pct >= 50 ? 'linear-gradient(90deg,#D97706,#FCD34D)' : 'linear-gradient(90deg,#DC2626,#FCA5A5)',
                borderRadius: '99px', transition: 'width 600ms ease',
              }} />
            </div>

            {g.feedback && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1E293B', borderRadius: '8px',
              }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                  Feedback
                </p>
                <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {g.feedback}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
