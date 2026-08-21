import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import type { Profile } from '@/types/database'

interface AppLayoutProps {
  profile: Profile
  children: React.ReactNode
}

export function AppLayout({ profile, children }: AppLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E' }}>
      <Sidebar role={profile.role} />
      <TopBar profile={profile} />

      {/* Main content area */}
      <main
        id="main-content"
        style={{
          marginLeft: '240px',
          // TopBar now grows by the top inset, so clear both (item 2).
          marginTop: 'calc(64px + env(safe-area-inset-top))',
          minHeight: 'calc(100vh - 64px)',
          padding: '32px',
          transition: 'margin-left 200ms ease',
        }}
        className="main-content"
      >
        {children}
      </main>

      <style>{`
        @media (max-width: 767px) {
          .main-content {
            margin-left: 0 !important;
            /* Left/right honor side insets (landscape notch); bottom clears
               the tab bar (~64px) plus the home-indicator inset (item 2). */
            padding-top: 20px !important;
            padding-left: max(16px, env(safe-area-inset-left)) !important;
            padding-right: max(16px, env(safe-area-inset-right)) !important;
            padding-bottom: calc(80px + env(safe-area-inset-bottom)) !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .main-content { margin-left: 64px !important; }
        }
      `}</style>
    </div>
  )
}
