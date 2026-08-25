'use client'

import { useState, useMemo } from 'react'
import type { Profile, Assignment, Submission } from '@/types/database'

interface StudentsTabProps {
  students: Profile[]
  assignments: Assignment[]
  submissions: Submission[]
  courseName: string
}

interface StudentRow {
  id: string
  fullName: string
  indexNumber: string
  submissionRate: number
  averageGrade: number | null
  totalSubmitted: number
  totalAssignments: number
  totalGraded: number
}

function computeStudentRows(
  students: Profile[],
  assignments: Assignment[],
  submissions: Submission[]
): StudentRow[] {
  const totalAssignments = assignments.length
  const subsByStudent = new Map<string, Submission[]>()
  for (const s of submissions) {
    const arr = subsByStudent.get(s.student_id) ?? []
    arr.push(s)
    subsByStudent.set(s.student_id, arr)
  }

  return students.map((student) => {
    const subs = subsByStudent.get(student.id) ?? []
    const totalSubmitted = subs.length
    const gradedSubs = subs.filter((s) => s.grade !== null)
    const totalGraded = gradedSubs.length

    let averageGrade: number | null = null
    if (totalGraded > 0) {
      const assignmentMap = new Map(assignments.map((a) => [a.id, a]))
      let totalPct = 0
      for (const sub of gradedSubs) {
        const assign = assignmentMap.get(sub.assignment_id)
        const maxScore = assign?.max_score ?? 100
        totalPct += maxScore > 0 ? ((sub.grade ?? 0) / maxScore) * 100 : 0
      }
      averageGrade = totalPct / totalGraded
    }

    return {
      id: student.id,
      fullName: student.full_name ?? '—',
      indexNumber: student.index_number ?? '—',
      submissionRate: totalAssignments > 0 ? (totalSubmitted / totalAssignments) * 100 : 0,
      averageGrade,
      totalSubmitted,
      totalAssignments,
      totalGraded,
    }
  })
}

function rateColor(pct: number): string {
  if (pct >= 75) return '#059669'
  if (pct >= 50) return '#D97706'
  return '#DC2626'
}

function gradeColor(pct: number | null): string {
  if (pct === null) return '#64748B'
  if (pct >= 70) return '#059669'
  if (pct >= 50) return '#D97706'
  return '#DC2626'
}

function exportGradesCSV(rows: StudentRow[], assignments: Assignment[], submissions: Submission[], courseName: string) {
  const subsByStudent = new Map<string, Map<string, Submission>>()
  for (const s of submissions) {
    if (!subsByStudent.has(s.student_id)) subsByStudent.set(s.student_id, new Map())
    subsByStudent.get(s.student_id)!.set(s.assignment_id, s)
  }

  const headers = [
    'Name',
    'Index Number',
    ...assignments.map((a) => `${a.title} (/${a.max_score})`),
    'Submission Rate (%)',
    'Average Grade (%)',
  ]

  const csvRows = rows.map((row) => {
    const grades = assignments.map((a) => {
      const sub = subsByStudent.get(row.id)?.get(a.id)
      if (!sub) return ''
      return sub.grade !== null ? String(sub.grade) : 'ungraded'
    })
    return [
      `"${row.fullName}"`,
      `"${row.indexNumber}"`,
      ...grades,
      Math.round(row.submissionRate),
      row.averageGrade !== null ? Math.round(row.averageGrade) : '',
    ]
  })

  const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${courseName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_grades.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function StudentsTab({ students, assignments, submissions, courseName }: StudentsTabProps) {
  const [search, setSearch] = useState('')

  const rows = useMemo(
    () => computeStudentRows(students, assignments, submissions),
    [students, assignments, submissions]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(
      (r) => r.fullName.toLowerCase().includes(q) || r.indexNumber.toLowerCase().includes(q)
    )
  }, [rows, search])

  return (
    <div style={{ animation: 'tabFadeIn 200ms ease' }}>
      {/* Header row: search + export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="form-input"
            placeholder="Search student by name or index number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>
        <button
          className="btn-primary"
          style={{ padding: '9px 18px', fontSize: '13px', whiteSpace: 'nowrap', minHeight: '40px' }}
          onClick={() => exportGradesCSV(rows, assignments, submissions, courseName)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV Grades
        </button>
      </div>

      {/* Summary */}
      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
        {filtered.length} student{filtered.length !== 1 ? 's' : ''}
        {search.trim() && ` matching "${search}"`}
        {' — '}{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '48px 40px', textAlign: 'center',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0', borderRadius: '12px',
        }}>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            {students.length === 0
              ? 'No students enrolled at this level yet.'
              : 'No students match your search.'}
          </p>
        </div>
      ) : (
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          overflow: 'hidden',
          minWidth: '520px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 140px 130px',
            padding: '12px 18px',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
          }}>
            {['Student Name', 'Index Number', 'Submission Rate', 'Avg. Grade'].map((h) => (
              <div key={h} style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((row, i) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 140px 130px',
                padding: '14px 18px',
                borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                alignItems: 'center',
                transition: 'background 100ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              {/* Name */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>
                  {row.fullName}
                </div>
              </div>

              {/* Index Number */}
              <div style={{ fontSize: '13px', color: '#475569', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                {row.indexNumber}
              </div>

              {/* Submission Rate */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '48px', height: '6px', borderRadius: '3px',
                  background: '#E2E8F0',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.min(row.submissionRate, 100)}%`,
                    height: '100%',
                    borderRadius: '3px',
                    background: rateColor(row.submissionRate),
                    transition: 'width 300ms ease',
                  }} />
                </div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: rateColor(row.submissionRate),
                }}>
                  {Math.round(row.submissionRate)}%
                </span>
              </div>

              {/* Average Grade */}
              <div>
                {row.averageGrade !== null ? (
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: `${gradeColor(row.averageGrade)}15`,
                    color: gradeColor(row.averageGrade),
                    border: `1px solid ${gradeColor(row.averageGrade)}30`,
                  }}>
                    {Math.round(row.averageGrade)}%
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}
