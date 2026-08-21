'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UploadZone } from '@/components/ui/UploadZone'
import { MetadataModal } from '@/components/ui/MetadataModal'
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

function RecordingRow({ recording, onDelete }: { recording: CourseRecording; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const playerType = recording.file_type === 'mp4' || recording.file_type === 'mov' ? 'video' : 'audio'

  async function handleDelete() {
    setDeleting(true)
    const path = recording.file_url.split('/course-recordings/')[1]
    if (path) await supabase.storage.from('course-recordings').remove([path])
    await supabase.from('course_recordings').delete().eq('id', recording.id)
    router.refresh()
    onDelete()
  }

  return (
    <div style={{
      padding: '16px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid #1E293B',
      borderRadius: '12px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <FileIcon fileType={recording.file_type} size={18} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', margin: 0 }}>
            {recording.title}
          </p>
          <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>
            {recording.file_type.toUpperCase()} · {formatBytes(recording.file_size)} ·{' '}
            {new Date(recording.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            style={{
              padding: '6px 10px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '7px',
              color: '#FCA5A5',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 150ms',
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#FCA5A5' }}>Delete?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ padding: '5px 10px', background: '#EF4444', border: 'none', borderRadius: '6px', color: '#FFFFFF', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {deleting ? '…' : 'Yes'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #334155', borderRadius: '6px', color: '#64748B', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              No
            </button>
          </div>
        )}
      </div>

      {/* Custom player */}
      <CustomPlayer src={recording.file_url} type={playerType} title={recording.title} />
    </div>
  )
}

interface RecordingsTabProps {
  courseId: string
  recordings: CourseRecording[]
}

export function RecordingsTab({ courseId, recordings }: RecordingsTabProps) {
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const grouped = groupByWeek(recordings)

  return (
    <div style={{ animation: 'tabFadeIn 200ms ease' }}>
      {/* Upload zone */}
      <div style={{ marginBottom: '28px' }}>
        <UploadZone
          accept=".mp4,.mov,.mp3,.wav,.aac,.webm"
          label="MP4, MP3, WAV — max 500 MB"
          onFileSelected={setPendingFile}
          disabled={!!pendingFile}
        />
      </div>

      <MetadataModal
        file={pendingFile}
        courseId={courseId}
        type="recording"
        onClose={() => setPendingFile(null)}
      />

      {recordings.length === 0 ? (
        <div style={{
          padding: '50px 30px',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed #1E293B',
          borderRadius: '12px',
        }}>
          <div style={{
            width: '48px', height: '48px', margin: '0 auto 14px',
            background: 'rgba(79,70,229,0.08)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '6px' }}>No recordings yet</p>
          <p style={{ fontSize: '13px', color: '#475569' }}>Upload lecture videos or audio using the zone above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[...grouped.entries()].map(([week, items]) => (
            <div key={week}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
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
                <span style={{ fontSize: '11px', color: '#475569' }}>{items.length} recording{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.map((r) => (
                  <RecordingRow key={r.id} recording={r} onDelete={() => {}} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
