export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#0A0F1E' }}>
      {/* Gradient orbs */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(79,70,229,0.4)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M12 3V21M4 7.5L20 16.5M20 7.5L4 16.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
              </svg>
            </div>
            <span style={{
              fontSize: '22px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Academic Hub
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '13px' }}>
            Professional Course Management Platform
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
