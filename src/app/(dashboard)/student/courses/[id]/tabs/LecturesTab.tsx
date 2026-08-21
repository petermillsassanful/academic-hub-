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
        padding: '50px 30px',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed #1E293B',
        borderRadius: '12px',
      }}>
        <div style={{
          width: '48px', height: '48px', margin: '0 auto 14px',
          background: 'rgba(79,70,229,0.08)', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '6px' }}>No lecture recordings yet</p>
        <p style={{ fontSize: '13px', color: '#475569' }}>Your lecturer hasn&apos;t uploaded any recordings yet. Check back soon.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {[...grouped.entries()].map(([week, items]) => (
        <div key={week}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{
              padding: '3px 10px',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: '99px',
              fontSize: '12px', fontWeight: '700', color: '#A78BFA',
            }}>
              Week {week}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#1E293B' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((r) => {
              const playerType = r.file_type === 'mp4' || r.file_type === 'mov' ? 'video' : 'audio'
              return (
                <div key={r.id} style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <FileIcon fileType={r.file_type} size={18} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', margin: 0 }}>{r.title}</p>
                      <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>
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
