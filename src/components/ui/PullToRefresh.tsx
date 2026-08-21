'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Pull-to-refresh for server-component pages in the Next.js App Router.
 *
 * How it works:
 *   1. Track touchstart/touchmove/touchend on the wrapper div.
 *   2. Only activate when the page is already scrolled to the very top
 *      (scrollTop === 0) and the finger moves downward.
 *   3. Show a spinner that scales in as the user pulls (up to THRESHOLD px).
 *   4. On release past the threshold, call router.refresh() which re-runs
 *      the parent server component and re-fetches all its data — no full
 *      page reload, no loss of client-side state in other tabs/layouts.
 *   5. Respects prefers-reduced-motion by skipping the pull animation.
 */

const THRESHOLD = 72   // px of pull before triggering refresh
const MAX_PULL  = 90   // px — clamps the visual drag distance

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const wrapRef  = useRef<HTMLDivElement>(null)
  const startY   = useRef(0)
  const pulling  = useRef(false)

  const [pullY,     setPullY]     = useState(0)   // 0 → MAX_PULL
  const [refreshing, setRefreshing] = useState(false)

  // ── Touch handlers ────────────────────────────────────────────────────────

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate if the scrollable parent is at the very top
    const scrollable = wrapRef.current?.closest('[data-scroll-root]') ?? document.documentElement
    if ((scrollable as Element).scrollTop > 2) return
    startY.current = e.touches[0].clientY
    pulling.current = true
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return
    const delta = e.touches[0].clientY - startY.current
    if (delta <= 0) {
      setPullY(0)
      return
    }
    // Rubber-band easing: drag feels progressively stiffer past half-threshold
    const clamped = Math.min(delta * 0.5, MAX_PULL)
    setPullY(clamped)
  }, [refreshing])

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false

    if (pullY >= THRESHOLD * 0.5) {
      // Past the trigger point → refresh
      setRefreshing(true)
      setPullY(0)
      router.refresh()
      // Give the server a moment to respond before hiding the spinner
      await new Promise(r => setTimeout(r, 1400))
      setRefreshing(false)
    } else {
      // Not far enough → snap back
      setPullY(0)
    }
  }, [pullY, router])

  // ── Progress indicator ────────────────────────────────────────────────────

  const progress = Math.min(pullY / (THRESHOLD * 0.5), 1)   // 0 → 1
  const indicatorVisible = pullY > 4 || refreshing

  return (
    <div
      ref={wrapRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ position: 'relative' }}
    >
      {/* Pull indicator */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: `translateX(-50%) translateY(${
            refreshing ? '12px' : `${pullY * 0.6}px`
          }) scale(${refreshing ? 1 : 0.6 + progress * 0.4})`,
          opacity: indicatorVisible ? 1 : 0,
          transition: refreshing || pullY === 0 ? 'all 300ms cubic-bezier(0.22,1,0.36,1)' : 'none',
          zIndex: 100,
          pointerEvents: 'none',
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(79,70,229,0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#818CF8"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              animation: refreshing ? 'ptr-spin 0.7s linear infinite' : 'none',
              transform: `rotate(${refreshing ? 0 : progress * 180}deg)`,
              transition: refreshing ? 'none' : 'transform 80ms linear',
            }}
          >
            {refreshing ? (
              /* Spinner arc */
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            ) : (
              /* Down arrow that morphs into a refresh icon */
              <>
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4" />
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Push content down while pulling */}
      <div style={{
        transform: `translateY(${pullY}px)`,
        transition: pullY === 0 ? 'transform 300ms cubic-bezier(0.22,1,0.36,1)' : 'none',
      }}>
        {children}
      </div>

      <style>{`
        @keyframes ptr-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
