'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UploadZone } from '@/components/ui/UploadZone'
import { MetadataModal } from '@/components/ui/MetadataModal'
import { FileIcon, formatBytes } from '@/components/ui/FileIcon'
import type { CourseMaterial } from '@/types/database'

interface ContentTabProps {
  courseId: string
  materials: CourseMaterial[]
}

// Group materials by week number
function groupByWeek(items: CourseMaterial[]): Map<number, CourseMaterial[]> {
  const map = new Map<number, CourseMaterial[]>()
  for (const item of items) {
    const week = item.week_number
    if (!map.has(week)) map.set(week, [])
    map.get(week)!.push(item)
  }
  return new Map([...map.entries()].sort((a, b) => a[0] - b[0]))
}

function MaterialRow({ material, onDelete }: { material: CourseMaterial; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    const path = material.file_url.split('/course-materials/')[1]
    if (path) await supabase.storage.from('course-materials').remove([path])
    await supabase.from('course_materials').delete().eq('id', material.id)
    router.refresh()
    onDelete()
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px 18px',
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      transition: 'all 150ms ease',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <FileIcon fileType={material.file_type} size={22} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', margin: 0, marginBottom: '2px' }}>
          {material.title}
        </p>
        {material.description && (
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0, marginBottom: '4px', lineHeight: 1.4 }}>
            {material.description}
          </p>
        )}
        <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
          {material.file_type.toUpperCase()} · {formatBytes(material.file_size)} ·{' '}
          {new Date(material.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
        {!confirming ? (
          <>
            {/* Download */}
            <a
              href={material.file_url}
              download
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '6px',
                color: '#1D4ED8',
                fontSize: '12px',
                fontWeight: '600',
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
            {/* Delete */}
            <button
              onClick={() => setConfirming(true)}
              style={{
                padding: '6px 10px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                color: '#DC2626',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FEF2F2' }}
              title="Delete material"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </button>
          </>
        ) : (
          /* Confirm delete */
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: '600' }}>Delete?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: '5px 10px',
                background: '#DC2626',
                border: 'none',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {deleting ? '…' : 'Yes'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                padding: '5px 10px',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                color: '#64748B',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function ContentTab({ courseId, materials }: ContentTabProps) {
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const grouped = groupByWeek(materials)

  return (
    <div style={{ animation: 'tabFadeIn 200ms ease' }}>
      {/* Upload zone */}
      <div style={{ marginBottom: '24px' }}>
        <UploadZone
          accept=".pdf,.pptx,.ppt,.docx,.doc,.txt,.md,.zip"
          label="PDF, PPTX, DOCX, ZIP, TXT — max 50 MB"
          onFileSelected={setPendingFile}
          disabled={!!pendingFile}
        />
      </div>

      {/* Metadata modal */}
      <MetadataModal
        file={pendingFile}
        courseId={courseId}
        type="material"
        onClose={() => setPendingFile(null)}
      />

      {/* Materials list or empty state */}
      {materials.length === 0 ? (
        <div style={{
          padding: '48px 30px',
          textAlign: 'center',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
        }}>
          <div style={{
            width: '48px', height: '48px', margin: '0 auto 12px',
            background: '#EFF6FF',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>No materials uploaded yet</p>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Use the upload zone above to add your lecture notes, slides, and code files.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[...grouped.entries()].map(([week, items]) => (
            <div
              key={week}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '18px 20px',
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
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                  Course Materials & Lecture Notes
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748B' }}>
                  {items.length} file{items.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((m) => (
                  <MaterialRow key={m.id} material={m} onDelete={() => {}} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
