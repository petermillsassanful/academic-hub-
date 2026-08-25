'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { getFileExtension, formatBytes } from '@/components/ui/FileIcon'
import { createCourseNotification } from '@/lib/notifications'

type UploadType = 'material' | 'recording'

interface MetadataModalProps {
  file: File | null
  courseId: string
  type: UploadType
  onClose: () => void
}

export function MetadataModal({ file, courseId, type, onClose }: MetadataModalProps) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(file ? file.name.replace(/\.[^.]+$/, '') : '')
  const [description, setDescription] = useState('')
  const [weekNumber, setWeekNumber] = useState(1)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!file) return null

  const ext = getFileExtension(file.name)
  const bucket = type === 'material' ? 'course-materials' : 'course-recordings'
  const table  = type === 'material' ? 'course_materials' : 'course_recordings'

  async function handleUpload() {
    if (!file) return
    if (!title.trim()) { setError('Title is required.'); return }
    setError(null)
    setUploading(true)
    setProgress(0)

    try {
      // 1. Get auth token for XHR upload (real progress)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      // 2. Build storage path
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${courseId}/${Date.now()}-${safeName}`
      const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`

      // 3. XHR upload with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.min(95, Math.round((e.loaded / e.total) * 95)))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(100)
            resolve()
          } else {
            try {
              const body = JSON.parse(xhr.responseText)
              reject(new Error(body.message ?? `Upload failed (${xhr.status})`))
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`))
            }
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
        xhr.open('POST', uploadUrl)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.setRequestHeader('x-upsert', 'false')
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.setRequestHeader('Cache-Control', '3600')
        xhr.send(file)
      })

      // 4. Build public URL
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`

      // 5. Insert DB record
      const payload =
        type === 'material'
          ? {
              course_id: courseId,
              title: title.trim(),
              description: description.trim() || null,
              file_url: publicUrl,
              file_type: ext,
              file_size: file.size,
              week_number: weekNumber,
            }
          : {
              course_id: courseId,
              title: title.trim(),
              file_url: publicUrl,
              file_type: ext,
              file_size: file.size,
              week_number: weekNumber,
            }

      const { error: dbError } = await supabase.from(table).insert(payload as never)
      if (dbError) throw dbError

      // Send real notification to all enrolled students
      if (type === 'material') {
        await createCourseNotification({
          courseId,
          title: 'New Slide / Course Material',
          message: `New lecture material '${title.trim()}' was uploaded for Week ${weekNumber}.`,
          type: 'material',
          link: `/student/courses/${courseId}?tab=content`,
        })
      } else {
        await createCourseNotification({
          courseId,
          title: 'New Lecture Recording',
          message: `New recording '${title.trim()}' was uploaded for Week ${weekNumber}.`,
          type: 'recording',
          link: `/student/courses/${courseId}?tab=recordings`,
        })
      }

      setDone(true)
      router.refresh()
      setTimeout(() => {
        onClose()
      }, 800)
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Upload failed'
      setError(msg)
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    color: '#0F172A',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 150ms',
  }

  const title_ = type === 'material' ? 'Upload Material' : 'Upload Recording'

  return (
    <Modal isOpen={!!file} onClose={!uploading ? onClose : () => {}} title={title_}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* File info */}
        <div style={{
          padding: '12px 14px',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', color: '#0F172A', fontWeight: '600', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </p>
            <p style={{ fontSize: '11px', color: '#64748B', margin: 0, fontWeight: '500' }}>
              {ext.toUpperCase()} · {formatBytes(file.size)}
            </p>
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
            placeholder="e.g. Lecture 1 — Introduction to Java"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
          />
        </div>

        {/* Description (materials only) */}
        {type === 'material' && (
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              placeholder="Brief description of this material…"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
            />
          </div>
        )}

        {/* Week number */}
        <div>
          <label style={labelStyle}>Week Number *</label>
          <input
            type="number"
            min={1}
            max={52}
            value={weekNumber}
            onChange={(e) => setWeekNumber(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={uploading}
            style={{ ...inputStyle, width: '100px' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#DC2626',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* Progress bar */}
        {uploading && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Uploading…</span>
              <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: '700' }}>{progress}%</span>
            </div>
            <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: '#2563EB',
                borderRadius: '99px',
                transition: 'width 200ms ease',
              }} />
            </div>
          </div>
        )}

        {/* Done state */}
        {done && (
          <div style={{
            padding: '10px 14px',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            color: '#059669',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Upload complete!
          </div>
        )}

        {/* Actions */}
        {!done && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
            <button
              onClick={onClose}
              disabled={uploading}
              style={{
                padding: '9px 18px',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                color: '#475569',
                fontSize: '14px',
                fontWeight: '600',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary"
              style={{
                padding: '9px 22px',
                fontSize: '14px',
              }}
            >
              {uploading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Uploading…
                </>
              ) : 'Upload'}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Modal>
  )
}
