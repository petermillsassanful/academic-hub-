'use client'

import { useState, useRef, useCallback } from 'react'

interface UploadZoneProps {
  accept: string          // MIME types, e.g. ".pdf,.pptx,.docx"
  label: string           // e.g. "PDF, PPTX or DOCX"
  onFileSelected: (file: File) => void
  disabled?: boolean
}

export function UploadZone({ accept, label, onFileSelected, disabled = false }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) onFileSelected(file)
  }, [disabled, onFileSelected])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelected(file)
    // reset so same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }, [onFileSelected])

  const baseStyle: React.CSSProperties = {
    border: `2px dashed ${dragActive ? '#6366F1' : '#334155'}`,
    borderRadius: '14px',
    padding: '36px 20px',
    textAlign: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 200ms ease',
    background: dragActive
      ? 'rgba(79,70,229,0.08)'
      : 'rgba(255,255,255,0.02)',
    opacity: disabled ? 0.6 : 1,
  }

  return (
    <div
      style={baseStyle}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label={`Upload ${label} file`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      onMouseEnter={(e) => {
        if (!disabled && !dragActive) {
          e.currentTarget.style.borderColor = '#4F46E5'
          e.currentTarget.style.background = 'rgba(79,70,229,0.05)'
        }
      }}
      onMouseLeave={(e) => {
        if (!dragActive) {
          e.currentTarget.style.borderColor = '#334155'
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Icon */}
      <div style={{
        width: '52px', height: '52px',
        margin: '0 auto 14px',
        background: dragActive ? 'rgba(79,70,229,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${dragActive ? 'rgba(79,70,229,0.4)' : '#1E293B'}`,
        borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 200ms ease',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={dragActive ? '#818CF8' : '#64748B'} strokeWidth="1.8">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>

      <p style={{ fontSize: '14px', fontWeight: '600', color: dragActive ? '#FFFFFF' : '#94A3B8', marginBottom: '4px' }}>
        {dragActive ? 'Drop it here!' : 'Drag & drop or click to upload'}
      </p>
      <p style={{ fontSize: '12px', color: '#475569' }}>
        {label}
      </p>
    </div>
  )
}
