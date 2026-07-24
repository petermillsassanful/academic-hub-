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
          marginTop: '64px',
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
            padding: 20px 16px 80px !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .main-content { margin-left: 64px !important; }
        }
      `}</style>
    </div>
  )
}
