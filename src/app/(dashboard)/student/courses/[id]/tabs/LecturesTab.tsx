'use client'

import { CustomPlayer } from '@/components/ui/CustomPlayer'
import { FileIcon, formatBytes } from '@/components/ui/FileIcon'
import type { CourseRecording } from '@/types/database'

function groupByWeek(items: CourseRecording[]): Map<number, CourseRecording[]> {
  const map = new Map<number, CourseRecording[]>()
  for (const item of items) {
    if (!map.has(item.week_number)) map.set(item.week_number, [])
    map.get(item.week_number)!.push(item)
  }
  return new Map([...map.entries()].sort((a, b) => a[0] - b[0]))
}

interface LecturesTabProps {
  recordings: CourseRecording[]
}

export function LecturesTab({ recordings }: LecturesTabProps) {
  const grouped = groupByWeek(recordings)

  if (recordings.length === 0) {
    return (
      <div style={{
        padding: '48px 30px',
        textAlign: 'center',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        animation: 'tabFadeIn 200ms ease',
      }}>
        <div style={{
          width: '48px', height: '48px', margin: '0 auto 12px',
          background: '#EFF6FF', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
        <p style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>No lecture recordings yet</p>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Your lecturer hasn&apos;t uploaded any recordings yet. Check back soon.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'tabFadeIn 200ms ease' }}>
      {[...grouped.entries()].map(([week, items]) => (
        <div
          key={week}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          {/* Module / Week Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
            paddingBottom: '12px', borderBottom: '1px solid #F1F5F9',
          }}>
            <span style={{
              padding: '3px 10px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '6px',
              fontSize: '12px', fontWeight: '700', color: '#1D4ED8',
            }}>
              Week {week}
            </span>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
              Lecture Recordings & Audio
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748B' }}>
              {items.length} recording{items.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((r) => {
              const playerType = r.file_type === 'mp4' || r.file_type === 'mov' ? 'video' : 'audio'
              return (
                <div key={r.id} style={{
                  padding: '16px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <FileIcon fileType={r.file_type} size={20} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: 0 }}>{r.title}</p>
                      <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                        {r.file_type.toUpperCase()} · {formatBytes(r.file_size)}
                      </p>
                    </div>
                  </div>
                  <CustomPlayer src={r.file_url} type={playerType} title={r.title} />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
