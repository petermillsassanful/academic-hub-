export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Force html/body to match so no white ever shows on scroll */}
      <style>{`
        html, body {
          background: #0d1b3e !important;
          margin: 0;
          padding: 0;
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Full-bleed campus background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/campus-bg.jpg"
          alt=""
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            objectPosition: 'center center',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Dark overlay for readability */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(13, 27, 62, 0.72)',
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
            maxWidth: '460px',
            padding: '32px 16px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Branding */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                flexShrink: 0,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="#FFFFFF" strokeWidth="2.2" strokeLinejoin="round"/>
                  <path d="M12 3V21M4 7.5L20 16.5M20 7.5L4 16.5" stroke="#93C5FD" strokeWidth="1.6" strokeOpacity="0.9"/>
                </svg>
              </div>
              <span style={{
                fontSize: '28px',
                fontWeight: '800',
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}>
                Academic Hub
              </span>
            </div>
            <p style={{
              color: 'rgba(219, 234, 254, 0.9)',
              fontSize: '13.5px',
              fontWeight: '500',
              margin: 0,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              letterSpacing: '0.01em',
            }}>
              University Course &amp; Learning Management System
            </p>
          </div>

          {/* Glassmorphism Card */}
          <div style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.10)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            padding: '0',
            overflow: 'hidden',
          }}>
            {children}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'rgba(186, 210, 255, 0.7)',
            fontWeight: '500',
            letterSpacing: '0.01em',
          }}>
            &copy; {new Date().getFullYear()} Academic Hub LMS &bull; Empowering Higher Education
          </div>
        </div>
      </div>
    </>
  )
}
