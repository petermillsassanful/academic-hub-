'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export type AdminTab = 'content' | 'recordings' | 'assignments' | 'students' | 'analytics'
export type StudentTab = 'lectures' | 'materials' | 'assignments' | 'grades'

type Tab = { id: string; label: string; icon: React.ReactNode }

const ADMIN_TABS: Tab[] = [
  {
    id: 'content',
    label: 'Content',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  },
  {
    id: 'recordings',
    label: 'Recordings',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  },
  {
    id: 'assignments',
    label: 'Assignments',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    id: 'students',
    label: 'Students',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
]

const STUDENT_TABS: Tab[] = [
  {
    id: 'lectures',
    label: 'Lectures',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  },
  {
    id: 'materials',
    label: 'Materials',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  },
  {
    id: 'assignments',
    label: 'Assignments',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    id: 'grades',
    label: 'Grades',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  },
]

interface CourseTabBarProps {
  role: 'admin' | 'student'
  activeTab: string
}

export function CourseTabBar({ role, activeTab }: CourseTabBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabs = role === 'admin' ? ADMIN_TABS : STUDENT_TABS

  const searchParamsStr = searchParams.toString()

  const setTab = useCallback((tabId: string) => {
    const params = new URLSearchParams(searchParamsStr)
    params.set('tab', tabId)
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParamsStr])

  return (
    <>
      <div style={{
        display: 'flex',
        gap: '2px',
        borderBottom: '1px solid #1E293B',
        marginBottom: '28px',
        overflowX: 'auto',
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                minHeight: '44px',   /* 44px tap target */
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #4F46E5' : '2px solid transparent',
                color: isActive ? '#FFFFFF' : '#64748B',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap',
                marginBottom: '-1px',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#94A3B8' }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#64748B' }}
            >
              <span style={{ color: isActive ? '#818CF8' : 'inherit' }}>{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </div>
      <style>{`@keyframes tabFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </>
  )
}
