'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types/database'

const LEVELS = ['100', '200', '300', '400']

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [indexNumber, setIndexNumber] = useState('')
  const [level, setLevel] = useState(LEVELS[0])
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    if (role === 'student' && !indexNumber.trim()) {
      setError('Index number is required.')
      setLoading(false)
      return
    }

    const signupEmail = role === 'student'
      ? `${indexNumber.trim().toLowerCase()}@academichub.internal`
      : email

    const metadata: Record<string, string> = {
      full_name: fullName,
      role,
    }

    if (role === 'student') {
      metadata.index_number = indexNumber.trim()
      metadata.level = level
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: signupEmail,
      password,
      options: {
        data: metadata,
      },
    })

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered')) {
        setError(role === 'student'
          ? 'This index number is already registered.'
          : 'This email is already registered.')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    router.push(role === 'admin' ? '/admin' : '/student')
    router.refresh()
  }

  return (
    <div
      className="glass-card p-8"
      style={{ animation: 'fadeInUp 0.4s ease forwards' }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="mb-6">
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '6px' }}>
          Create your account
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B' }}>
          Join Academic Hub — it&apos;s completely free
        </p>
      </div>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Role Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94A3B8', marginBottom: '8px' }}>
            I am a…
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {([
              {
                value: 'admin' as Role,
                label: 'Lecturer',
                sublabel: 'Create & manage courses',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
              },
              {
                value: 'student' as Role,
                label: 'Student',
                sublabel: 'Access courses & submit work',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                ),
              },
            ] as { value: Role; label: string; sublabel: string; icon: React.ReactNode }[]).map(({ value, label, sublabel, icon }) => {
              const selected = role === value
              return (
                <button
                  key={value}
                  type="button"
                  id={`role-${value}`}
                  onClick={() => setRole(value)}
                  style={{
                    padding: '14px 12px',
                    borderRadius: '12px',
                    border: selected ? '2px solid #4F46E5' : '1px solid #334155',
                    background: selected ? 'rgba(79,70,229,0.12)' : 'rgba(30,41,59,0.5)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: selected ? '#818CF8' : '#64748B' }}>{icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: selected ? '#FFFFFF' : '#94A3B8' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.3 }}>{sublabel}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="signup-name"
            style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94A3B8', marginBottom: '6px' }}
          >
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            className="form-input"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        {/* Conditional: Email (admin) or Index Number + Level (student) */}
        {role === 'admin' ? (
          <div>
            <label
              htmlFor="signup-email"
              style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94A3B8', marginBottom: '6px' }}
            >
              Email address
            </label>
            <input
              id="signup-email"
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
          <>
            <div>
              <label
                htmlFor="signup-index"
                style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94A3B8', marginBottom: '6px' }}
              >
                Index Number
              </label>
              <input
                id="signup-index"
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
            <div>
              <label
                htmlFor="signup-level"
                style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94A3B8', marginBottom: '6px' }}
              >
                Level
              </label>
              <select
                id="signup-level"
                className="form-input"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                required
                style={{ cursor: 'pointer' }}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l} style={{ background: '#0A0F1E' }}>
                    Level {l}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Password */}
        <div>
          <label
            htmlFor="signup-password"
            style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94A3B8', marginBottom: '6px' }}
          >
            Password
            <span style={{ color: '#475569', fontWeight: 400, marginLeft: '6px' }}>min. 8 characters</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{ paddingRight: '44px' }}
            />
            <button
              type="button"
              id="toggle-password-signup"
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
          id="signup-submit"
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
              Creating account…
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div style={{
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid #1E293B',
        textAlign: 'center',
        fontSize: '14px',
        color: '#64748B',
      }}>
        Already have an account?{' '}
        <Link
          href="/login"
          style={{ color: '#818CF8', fontWeight: '500', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}
