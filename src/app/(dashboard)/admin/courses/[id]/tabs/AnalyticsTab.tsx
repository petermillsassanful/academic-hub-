'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { Profile, Assignment, Submission } from '@/types/database'

interface AnalyticsTabProps {
  students: Profile[]
  assignments: Assignment[]
  submissions: Submission[]
}

// ── Color helpers (same palette as StudentsTab) ─────────────────────────────

function rateColor(pct: number): string {
  if (pct >= 80) return '#34D399'
  if (pct >= 50) return '#FCD34D'
  return '#FCA5A5'
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{
      padding: '40px 32px', textAlign: 'center',
      background: 'rgba(255,255,255,0.02)',
      border: '1px dashed #1E293B', borderRadius: '12px',
    }}>
      <div style={{
        width: '44px', height: '44px', margin: '0 auto 14px',
        background: 'rgba(79,70,229,0.08)', borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '4px' }}>{title}</p>
      <p style={{ fontSize: '13px', color: '#475569', maxWidth: '280px', margin: '0 auto', lineHeight: 1.5 }}>{subtitle}</p>
    </div>
  )
}

// ── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, gradientClass, iconColor }: {
  label: string
  value: number | string
  icon: React.ReactNode
  gradientClass: string
  iconColor: string
}) {
  return (
    <div
      className={`glass-card ${gradientClass}`}
      style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: iconColor,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', fontWeight: '500' }}>
          {label}
        </div>
      </div>
    </div>
  )
}

// ── Custom Recharts tooltip ─────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155',
      borderRadius: '8px', padding: '8px 12px',
      fontSize: '12px', color: '#E2E8F0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontWeight: '600', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: '#94A3B8' }}>{payload[0].value} student{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function AnalyticsTab({ students, assignments, submissions }: AnalyticsTabProps) {
  const totalStudents = students.length
  const totalAssignments = assignments.length

  // ── Summary stats ──────────────────────────────────────────────────────────

  const { averageGrade, overallSubmissionRate } = useMemo(() => {
    const assignmentMap = new Map(assignments.map((a) => [a.id, a]))
    const gradedSubs = submissions.filter((s) => s.grade !== null)

    let avg: number | null = null
    if (gradedSubs.length > 0) {
      let totalPct = 0
      for (const sub of gradedSubs) {
        const assign = assignmentMap.get(sub.assignment_id)
        const maxScore = assign?.max_score ?? 100
        totalPct += maxScore > 0 ? ((sub.grade ?? 0) / maxScore) * 100 : 0
      }
      avg = totalPct / gradedSubs.length
    }

    const possible = totalStudents * totalAssignments
    const rate = possible > 0 ? (submissions.length / possible) * 100 : null

    return { averageGrade: avg, overallSubmissionRate: rate }
  }, [students, assignments, submissions, totalStudents, totalAssignments])

  // ── Submission rate per assignment ─────────────────────────────────────────

  const submissionRates = useMemo(() => {
    const subsByAssignment = new Map<string, number>()
    for (const s of submissions) {
      subsByAssignment.set(s.assignment_id, (subsByAssignment.get(s.assignment_id) ?? 0) + 1)
    }
    return assignments.map((a) => {
      const count = subsByAssignment.get(a.id) ?? 0
      const pct = totalStudents > 0 ? (count / totalStudents) * 100 : 0
      return { id: a.id, title: a.title, count, total: totalStudents, pct }
    })
  }, [assignments, submissions, totalStudents])

  // ── Grade distribution ────────────────────────────────────────────────────

  const gradeDistribution = useMemo(() => {
    const assignmentMap = new Map(assignments.map((a) => [a.id, a]))
    const bins = [
      { range: '0–49', min: 0, max: 49, count: 0 },
      { range: '50–59', min: 50, max: 59, count: 0 },
      { range: '60–69', min: 60, max: 69, count: 0 },
      { range: '70–79', min: 70, max: 79, count: 0 },
      { range: '80–89', min: 80, max: 89, count: 0 },
      { range: '90–100', min: 90, max: 100, count: 0 },
    ]

    for (const sub of submissions) {
      if (sub.grade === null) continue
      const assign = assignmentMap.get(sub.assignment_id)
      const maxScore = assign?.max_score ?? 100
      const pct = maxScore > 0 ? (sub.grade / maxScore) * 100 : 0
      const clamped = Math.min(Math.max(pct, 0), 100)
      for (const bin of bins) {
        if (clamped >= bin.min && clamped <= bin.max) {
          bin.count++
          break
        }
      }
    }

    return bins
  }, [assignments, submissions])

  const hasGradedSubmissions = gradeDistribution.some((b) => b.count > 0)

  // ── Active vs inactive students ───────────────────────────────────────────

  const { activeStudents, inactiveStudents } = useMemo(() => {
    const studentIdsWithSubs = new Set(submissions.map((s) => s.student_id))
    const active = students.filter((s) => studentIdsWithSubs.has(s.id)).length
    return { activeStudents: active, inactiveStudents: totalStudents - active }
  }, [students, submissions, totalStudents])

  const activityData = useMemo(() => {
    if (totalStudents === 0 || totalAssignments === 0) return []
    return [
      { name: 'Active', value: activeStudents, color: '#6366F1' },
      { name: 'Inactive', value: inactiveStudents, color: '#1E293B' },
    ]
  }, [activeStudents, inactiveStudents, totalStudents, totalAssignments])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ animation: 'tabFadeIn 200ms ease' }}>
      {/* ── Summary Stat Cards ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '32px',
      }}>
        <StatCard
          label="Total Students"
          value={totalStudents}
          gradientClass="stat-gradient-indigo"
          iconColor="#818CF8"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard
          label="Assignments Posted"
          value={totalAssignments}
          gradientClass="stat-gradient-emerald"
          iconColor="#34D399"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
        />
        <StatCard
          label="Average Grade"
          value={averageGrade !== null ? `${Math.round(averageGrade)}%` : '—'}
          gradientClass="stat-gradient-amber"
          iconColor="#FCD34D"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>}
        />
        <StatCard
          label="Submission Rate"
          value={overallSubmissionRate !== null ? `${Math.round(overallSubmissionRate)}%` : '—'}
          gradientClass="stat-gradient-slate"
          iconColor="#94A3B8"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>}
        />
      </div>

      {/* ── Submission Rate per Assignment ──────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', marginBottom: '18px', letterSpacing: '-0.01em' }}>
          Submission Rate per Assignment
        </h3>
        {totalAssignments === 0 ? (
          <EmptyState
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
            title="No assignments yet"
            subtitle="Create an assignment to start tracking submission rates."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {submissionRates.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Title */}
                <div style={{
                  width: '180px', flexShrink: 0,
                  fontSize: '13px', fontWeight: '500', color: '#E2E8F0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} title={item.title}>
                  {item.title}
                </div>

                {/* Bar track */}
                <div style={{
                  flex: 1, height: '10px', borderRadius: '5px',
                  background: 'rgba(255,255,255,0.04)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.min(item.pct, 100)}%`,
                    height: '100%',
                    borderRadius: '5px',
                    background: rateColor(item.pct),
                    transition: 'width 400ms ease',
                    minWidth: item.count > 0 ? '4px' : '0',
                  }} />
                </div>

                {/* Count + percentage */}
                <div style={{
                  width: '110px', flexShrink: 0,
                  fontSize: '12px', fontWeight: '600',
                  color: rateColor(item.pct),
                  textAlign: 'right',
                }}>
                  {item.count}/{item.total} submitted · {Math.round(item.pct)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '24px',
      }}>
        {/* Grade Distribution Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', marginBottom: '18px', letterSpacing: '-0.01em' }}>
            Grade Distribution
          </h3>
          {!hasGradedSubmissions ? (
            <EmptyState
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
              title="No grades yet"
              subtitle="Grade some submissions to see the distribution here."
            />
          ) : (
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <XAxis
                    dataKey="range"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    axisLine={{ stroke: '#1E293B' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={42}>
                    {gradeDistribution.map((entry) => (
                      <Cell
                        key={entry.range}
                        fill={entry.count > 0 ? '#6366F1' : 'rgba(99, 102, 241, 0.15)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Active vs Inactive Students (Donut) */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', marginBottom: '18px', letterSpacing: '-0.01em' }}>
            Student Activity
          </h3>
          {activityData.length === 0 ? (
            <EmptyState
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
              title={totalStudents === 0 ? 'No students yet' : 'No assignments yet'}
              subtitle={totalStudents === 0
                ? 'Students at this level will appear here automatically.'
                : 'Create an assignment to track student activity.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Donut chart */}
              <div style={{ width: '200px', height: '200px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {activityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#FFFFFF', lineHeight: 1 }}>
                    {activeStudents}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                    of {totalStudents}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
                {activityData.map((entry) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '3px',
                      background: entry.color,
                      border: entry.name === 'Inactive' ? '1px solid #334155' : 'none',
                    }} />
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive override for the charts grid */}
      <style>{`
        @media (max-width: 800px) {
          div[style*="gridTemplateColumns: 1fr 320px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
