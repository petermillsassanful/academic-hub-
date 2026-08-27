'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type LoginMode = 'lecturer' | 'student'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [mode, setMode] = useState<LoginMode>('student')
  const [email, setEmail] = useState('')
  const [indexNumber, setIndexNumber] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'confirmation_failed'
      ? 'Confirmation link is invalid or expired. Please request a new one below.'
      : null
  )
  const [showPassword, setShowPassword] = useState(false)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [showDevShortcuts, setShowDevShortcuts] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setEmailNotConfirmed(false)
    setResendSuccess(false)

    const loginEmail = mode === 'student'
      ? `${indexNumber.trim().toLowerCase()}@academichub.internal`
      : email

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    })

    if (signInError) {
      if (
        signInError.message.toLowerCase().includes('email not confirmed') ||
        signInError.message.toLowerCase().includes('email_not_confirmed')
      ) {
        setEmailNotConfirmed(true)
        setError('Your email address hasn\'t been confirmed yet.')
      } else if (signInError.message.toLowerCase().includes('invalid login credentials')) {
        setError(mode === 'student'
          ? 'Invalid index number or password.'
          : 'Invalid email or password.')
      } else {
        setError(signInError.message)
      }
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>()

      router.push(profile?.role === 'admin' ? '/admin' : '/student')
      router.refresh()
    }
  }

  async function handleResendConfirmation() {
    if (!email) {
      setError('Please enter your email address above first.')
      return
    }

    setResendLoading(true)
    setResendSuccess(false)

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setResendLoading(false)

    if (resendError) {
      setError(resendError.message)
    } else {
      setResendSuccess(true)
      setEmailNotConfirmed(false)
      setError(null)
    }
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '32px',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        borderRadius: '16px',
        boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.35), 0 4px 12px rgba(0, 0, 0, 0.1)',
        animation: 'fadeInUp 0.4s ease forwards',
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Dev shortcuts banner — collapsed by default */}
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setShowDevShortcuts((s) => !s)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 12px',
            background: '#F8FAFC',
            border: '1px dashed #CBD5E1',
            borderRadius: '8px',
            color: '#64748B',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span>⚡ Quick Fill Demo Logins</span>
          <span style={{ fontSize: '11px' }}>{showDevShortcuts ? '▲ hide' : '▼ show'}</span>
        </button>

        {showDevShortcuts && (
          <div style={{
            marginTop: '8px',
            padding: '10px 12px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <button
              type="button"
              onClick={() => {
                setMode('lecturer')
                setEmail('profsamuel@academichub.edu')
                setPassword('samuel1234')
                setError(null)
              }}
              style={{
                textAlign: 'left',
                padding: '6px 8px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#1E293B',
                cursor: 'pointer',
              }}
            >
              👨‍🏫 Fill Lecturer: <strong>profsamuel@academichub.edu</strong>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('student')
                setIndexNumber('PS/CSC/22/0001')
                setPassword('kwame1234')
                setError(null)
              }}
              style={{
                textAlign: 'left',
                padding: '6px 8px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#1E293B',
                cursor: 'pointer',
              }}
            >
              🎓 Fill Student: <strong>PS/CSC/22/0001</strong>
            </button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
          Portal Sign In
        </h1>
        <p style={{ fontSize: '13px', color: '#64748B' }}>
          Select your role and enter credentials to continue
        </p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Mode Toggle */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
            Sign in as…
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {([
              { value: 'lecturer' as LoginMode, label: 'Lecturer', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              )},
              { value: 'student' as LoginMode, label: 'Student', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              )},
            ]).map(({ value, label, icon }) => {
              const selected = mode === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setMode(value); setError(null); setEmailNotConfirmed(false); setResendSuccess(false) }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: selected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    background: selected ? '#EFF6FF' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: selected ? '#2563EB' : '#64748B' }}>{icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: selected ? '#1D4ED8' : '#64748B' }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Conditional: Email or Index Number */}
        {mode === 'lecturer' ? (
          <div>
            <label
              htmlFor="login-email"
              style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}
            >
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        ) : (
          <div>
            <label
              htmlFor="login-index"
              style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}
            >
              Index Number
            </label>
            <input
              id="login-index"
              type="text"
              className="form-input"
              placeholder="e.g. PS/CSC/22/0001"
              value={indexNumber}
              onChange={(e) => setIndexNumber(e.target.value)}
              required
              autoComplete="username"
              style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}
            />
          </div>
        )}

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}
          >
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ paddingRight: '44px' }}
            />
            <button
              type="button"
              id="toggle-password-login"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
                padding: '4px',
              }}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            padding: '12px 14px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px',
            color: '#FCA5A5',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* Resend confirmation email panel — only for lecturer mode */}
        {emailNotConfirmed && mode === 'lecturer' && (
          <div style={{
            padding: '14px 16px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <p style={{ fontSize: '13px', color: '#FCD34D', lineHeight: 1.5, margin: 0 }}>
              Check your inbox for a confirmation email, or get a new one:
            </p>
            <button
              type="button"
              id="resend-confirmation-btn"
              onClick={handleResendConfirmation}
              disabled={resendLoading}
              style={{
                padding: '9px 16px',
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.4)',
                borderRadius: '8px',
                color: '#FCD34D',
                fontSize: '13px',
                fontWeight: '600',
                cursor: resendLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 150ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
              }}
              onMouseEnter={(e) => {
                if (!resendLoading) {
                  e.currentTarget.style.background = 'rgba(245,158,11,0.25)'
                  e.currentTarget.style.color = '#FFFFFF'
                }
              }}
              onMouseLeave={(e) => {
                if (!resendLoading) {
                  e.currentTarget.style.background = 'rgba(245,158,11,0.15)'
                  e.currentTarget.style.color = '#FCD34D'
                }
              }}
            >
              {resendLoading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Resend confirmation email
                </>
              )}
            </button>
          </div>
        )}

        {/* Resend success */}
        {resendSuccess && (
          <div style={{
            padding: '12px 14px',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '10px',
            color: '#6EE7B7',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Confirmation email sent! Check your inbox and click the link to activate your account.
          </div>
        )}

        <button
          id="login-submit"
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', marginTop: '4px', padding: '12px 20px', fontSize: '15px' }}
        >
          {loading ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Signing in…
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div style={{
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid #E2E8F0',
        textAlign: 'center',
        fontSize: '14px',
        color: '#64748B',
      }}>
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          style={{ color: '#2563EB', fontWeight: '600', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Create account
        </Link>
      </div>
    </div>
  )
}
