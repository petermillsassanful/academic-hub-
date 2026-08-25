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
    border: `2px dashed ${dragActive ? '#2563EB' : '#CBD5E1'}`,
    borderRadius: '12px',
    padding: '32px 20px',
    textAlign: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease',
    background: dragActive
      ? '#EFF6FF'
      : '#FFFFFF',
    opacity: disabled ? 0.6 : 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
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
          e.currentTarget.style.borderColor = '#2563EB'
          e.currentTarget.style.background = '#F8FAFC'
        }
      }}
      onMouseLeave={(e) => {
        if (!dragActive) {
          e.currentTarget.style.borderColor = '#CBD5E1'
          e.currentTarget.style.background = '#FFFFFF'
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
        width: '48px', height: '48px',
        margin: '0 auto 12px',
        background: dragActive ? '#DBEAFE' : '#F1F5F9',
        borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 150ms ease',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={dragActive ? '#1D4ED8' : '#2563EB'} strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>

      <p style={{ fontSize: '14px', fontWeight: '700', color: dragActive ? '#1D4ED8' : '#0F172A', marginBottom: '4px' }}>
        {dragActive ? 'Drop file to upload' : 'Click or drag & drop file to upload'}
      </p>
      <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
        {label}
      </p>
    </div>
  )
}
