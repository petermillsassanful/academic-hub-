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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <p style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>No materials uploaded yet</p>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Your lecturer hasn&apos;t uploaded any course materials yet. Check back soon.</p>
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
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px',
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
              Lecture Notes & Resources
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748B' }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* List of Material Items */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((m) => (
              <div key={m.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 0',
                borderBottom: '1px solid #F1F5F9',
              }}>
                <FileIcon fileType={m.file_type} size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', margin: 0, marginBottom: '2px' }}>
                    {m.title}
                  </p>
                  {m.description && (
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0, marginBottom: '3px', lineHeight: 1.4 }}>
                      {m.description}
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
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
                    padding: '6px 14px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '6px',
                    color: '#1D4ED8',
                    fontSize: '12px', fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#DBEAFE' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#EFF6FF' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
