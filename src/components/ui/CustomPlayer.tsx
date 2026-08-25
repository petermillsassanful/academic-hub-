'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface CustomPlayerProps {
  src: string
  type: 'video' | 'audio'
  title?: string
}

function formatTime(s: number): string {
  if (isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function CustomPlayer({ src, type, title }: CustomPlayerProps) {
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [seeking, setSeeking] = useState(false)

  const togglePlay = useCallback(() => {
    const el = mediaRef.current
    if (!el) return
    if (playing) el.pause(); else el.play().catch(() => {})
  }, [playing])

  const handleTimeUpdate = useCallback(() => {
    if (!seeking) setCurrentTime(mediaRef.current?.currentTime ?? 0)
  }, [seeking])

  const handleLoadedMetadata = useCallback(() => {
    setDuration(mediaRef.current?.duration ?? 0)
  }, [])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    setCurrentTime(t)
    if (mediaRef.current) mediaRef.current.currentTime = t
  }, [])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (mediaRef.current) {
      mediaRef.current.volume = v
      mediaRef.current.muted = v === 0
    }
    setMuted(v === 0)
  }, [])

  const toggleMute = useCallback(() => {
    const el = mediaRef.current
    if (!el) return
    el.muted = !muted
    setMuted(!muted)
  }, [muted])

  useEffect(() => {
    const el = mediaRef.current
    if (!el) return
    const onPlay  = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)
    el.addEventListener('play',  onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('play',  onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
    }
  }, [])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const controlBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94A3B8',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 120ms',
  }

  const sliderStyle: React.CSSProperties = {
    WebkitAppearance: 'none',
    appearance: 'none',
    height: '4px',
    borderRadius: '99px',
    outline: 'none',
    cursor: 'pointer',
    background: `linear-gradient(to right, #4F46E5 ${progress}%, #334155 ${progress}%)`,
  }

  return (
    <div style={{
      background: '#0F172A',
      border: '1px solid #1E293B',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Video element */}
      {type === 'video' && (
        <div style={{ position: 'relative', background: '#000', cursor: 'pointer' }} onClick={togglePlay}>
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'contain' }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            preload="metadata"
          />
          {!playing && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
            }}>
              <div style={{
                width: '52px', height: '52px',
                background: 'rgba(79,70,229,0.85)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 24px rgba(79,70,229,0.4)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audio element (hidden) */}
      {type === 'audio' && (
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          preload="metadata"
        />
      )}

      {/* Controls bar */}
      <div style={{ padding: '12px 16px' }}>
        {title && type === 'audio' && (
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginBottom: '10px' }}>{title}</p>
        )}

        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          onMouseDown={() => setSeeking(true)}
          onMouseUp={() => setSeeking(false)}
          style={{ ...sliderStyle, width: '100%', marginBottom: '10px' }}
        />

        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            style={{ ...controlBtn, color: '#FFFFFF' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#818CF8' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#FFFFFF' }}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </button>

          {/* Time */}
          <span style={{ fontSize: '12px', color: '#64748B', minWidth: '80px' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div style={{ flex: 1 }} />

          {/* Mute button */}
          <button
            onClick={toggleMute}
            style={controlBtn}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#818CF8' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8' }}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted || volume === 0 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>

          {/* Volume slider */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            style={{
              ...sliderStyle,
              width: '70px',
              background: `linear-gradient(to right, #4F46E5 ${(muted ? 0 : volume) * 100}%, #334155 ${(muted ? 0 : volume) * 100}%)`,
            }}
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Range input global styles */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: #4F46E5;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(79,70,229,0.5);
        }
      `}</style>
    </div>
  )
}
