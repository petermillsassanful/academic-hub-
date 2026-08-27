export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-x-hidden"
      style={{
        backgroundImage: "url('/campus-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#0F172A',
      }}
    >
      {/* Cinematic Dark Gradient & Subtle Vignette Overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.82) 100%), linear-gradient(180deg, rgba(27, 37, 89, 0.5) 0%, rgba(15, 23, 42, 0.75) 100%)',
          backdropFilter: 'blur(1.5px)',
          WebkitBackdropFilter: 'blur(1.5px)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4 py-10 flex flex-col items-center">
        {/* Academic Hub Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-2.5">
            <div style={{
              width: '46px',
              height: '46px',
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.4)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="#1B2559" strokeWidth="2.2" strokeLinejoin="round"/>
                <path d="M12 3V21M4 7.5L20 16.5M20 7.5L4 16.5" stroke="#2563EB" strokeWidth="1.6" strokeOpacity="0.8"/>
              </svg>
            </div>
            <span style={{
              fontSize: '26px',
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0,0,0,0.8)',
            }}>
              Academic Hub
            </span>
          </div>
          <p style={{
            color: 'rgba(241, 245, 249, 0.95)',
            fontSize: '13.5px',
            fontWeight: '500',
            margin: 0,
            textShadow: '0 1px 6px rgba(0, 0, 0, 0.7)',
            letterSpacing: '0.01em',
          }}>
            University Course &amp; Learning Management System
          </p>
        </div>

        {/* Card Content (Login / Signup) */}
        <div style={{ width: '100%' }}>
          {children}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'rgba(226, 232, 240, 0.8)',
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          fontWeight: '500',
        }}>
          &copy; {new Date().getFullYear()} Academic Hub LMS &bull; Empowering Higher Education
        </div>
      </div>
    </div>
  )
}
