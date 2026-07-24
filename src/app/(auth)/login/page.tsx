'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Get profile to redirect to correct dashboard
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      router.push(profile?.role === 'admin' ? '/admin' : '/student')
      router.refresh()
    }
  }

  return (
    <div
      className="glass-card p-8"
      style={{
        animation: 'fadeInUp 0.4s ease forwards',
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mb-6">
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '6px' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B' }}>
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            htmlFor="login-email"
            style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94A3B8', marginBottom: '6px' }}
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

        <div>
          <label
            htmlFor="login-password"
            style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94A3B8', marginBottom: '6px' }}
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

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>

      <div style={{
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid #1E293B',
        textAlign: 'center',
        fontSize: '14px',
        color: '#64748B',
      }}>
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          style={{ color: '#818CF8', fontWeight: '500', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Create one free
        </Link>
      </div>
    </div>
  )
}
