export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#F4F6F9' }}>
      
      {/* Subtle top branding wave or gradient */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '240px',
          background: 'linear-gradient(180deg, #1B2559 0%, #2563EB 100%)',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-2">
            <div style={{
              width: '42px',
              height: '42px',
              background: '#FFFFFF',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="#1B2559" strokeWidth="2.2" strokeLinejoin="round"/>
                <path d="M12 3V21M4 7.5L20 16.5M20 7.5L4 16.5" stroke="#1B2559" strokeWidth="1.5" strokeOpacity="0.5"/>
              </svg>
            </div>
            <span style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
            }}>
              Academic Hub
            </span>
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: 0 }}>
            University Course & Learning Management System
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
