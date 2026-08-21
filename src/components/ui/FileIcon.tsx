interface FileIconProps {
  fileType: string
  size?: number
}

export function FileIcon({ fileType, size = 20 }: FileIconProps) {
  const ext = fileType.toLowerCase().replace('.', '')

  if (ext === 'pdf') {
    return (
      <div style={{
        width: size + 8, height: size + 8,
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: '7px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="16" y2="17"/>
        </svg>
      </div>
    )
  }

  if (ext === 'pptx' || ext === 'ppt') {
    return (
      <div style={{
        width: size + 8, height: size + 8,
        background: 'rgba(249,115,22,0.12)',
        border: '1px solid rgba(249,115,22,0.25)',
        borderRadius: '7px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.8">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </div>
    )
  }

  if (ext === 'docx' || ext === 'doc') {
    return (
      <div style={{
        width: size + 8, height: size + 8,
        background: 'rgba(59,130,246,0.12)',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: '7px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="12" y2="17"/>
        </svg>
      </div>
    )
  }

  if (ext === 'mp4' || ext === 'mov' || ext === 'webm') {
    return (
      <div style={{
        width: size + 8, height: size + 8,
        background: 'rgba(139,92,246,0.12)',
        border: '1px solid rgba(139,92,246,0.25)',
        borderRadius: '7px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      </div>
    )
  }

  if (ext === 'mp3' || ext === 'wav' || ext === 'aac') {
    return (
      <div style={{
        width: size + 8, height: size + 8,
        background: 'rgba(16,185,129,0.12)',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: '7px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      </div>
    )
  }

  // Fallback
  return (
    <div style={{
      width: size + 8, height: size + 8,
      background: 'rgba(100,116,139,0.12)',
      border: '1px solid rgba(100,116,139,0.25)',
      borderRadius: '7px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    </div>
  )
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? 'file'
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
