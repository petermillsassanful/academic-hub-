export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Full-bleed campus background — object-fit:cover always fills edge-to-edge */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/campus-bg.jpg"
        alt=""
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 0,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Cinematic Dark Gradient & Vignette Overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: [
            'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.40) 0%, rgba(15, 23, 42, 0.80) 100%)',
            'linear-gradient(180deg, rgba(27, 37, 89, 0.45) 0%, rgba(15, 23, 42, 0.72) 100%)',
          ].join(', '),
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '448px',
          padding: '40px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Academic Hub Branding */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              background: 'rgba(255, 255, 255, 0.97)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.4)',
              flexShrink: 0,
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
            color: 'rgba(241, 245, 249, 0.92)',
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
