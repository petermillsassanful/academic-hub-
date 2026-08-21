import { FileIcon, formatBytes } from '@/components/ui/FileIcon'
import type { CourseMaterial } from '@/types/database'

function groupByWeek(items: CourseMaterial[]): Map<number, CourseMaterial[]> {
  const map = new Map<number, CourseMaterial[]>()
  for (const item of items) {
    if (!map.has(item.week_number)) map.set(item.week_number, [])
    map.get(item.week_number)!.push(item)
  }
  return new Map([...map.entries()].sort((a, b) => a[0] - b[0]))
}

interface MaterialsTabProps {
  materials: CourseMaterial[]
}

export function MaterialsTab({ materials }: MaterialsTabProps) {
  const grouped = groupByWeek(materials)

  if (materials.length === 0) {
    return (
      <div style={{
        padding: '50px 30px',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed #1E293B',
        borderRadius: '12px',
        animation: 'tabFadeIn 200ms ease',
      }}>
        <div style={{
          width: '48px', height: '48px', margin: '0 auto 14px',
          background: 'rgba(79,70,229,0.08)', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '6px' }}>No materials uploaded yet</p>
        <p style={{ fontSize: '13px', color: '#475569' }}>Your lecturer hasn&apos;t uploaded any course materials yet. Check back soon.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'tabFadeIn 200ms ease' }}>
      {[...grouped.entries()].map(([week, items]) => (
        <div key={week}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{
              padding: '3px 10px',
              background: 'rgba(79,70,229,0.1)',
              border: '1px solid rgba(79,70,229,0.2)',
              borderRadius: '99px',
              fontSize: '12px', fontWeight: '700', color: '#818CF8',
            }}>
              Week {week}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#1E293B' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((m) => (
              <div key={m.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1E293B',
                borderRadius: '10px',
              }}>
                <FileIcon fileType={m.file_type} size={18} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', margin: 0, marginBottom: '3px' }}>
                    {m.title}
                  </p>
                  {m.description && (
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0, marginBottom: '4px', lineHeight: 1.5 }}>
                      {m.description}
                    </p>
                  )}
                  <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>
                    {m.file_type.toUpperCase()} · {formatBytes(m.file_size)}
                  </p>
                </div>
                <a
                  href={m.file_url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px',
                    background: 'rgba(79,70,229,0.08)',
                    border: '1px solid rgba(79,70,229,0.2)',
                    borderRadius: '7px',
                    color: '#818CF8',
                    fontSize: '12px', fontWeight: '500',
                    textDecoration: 'none',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
