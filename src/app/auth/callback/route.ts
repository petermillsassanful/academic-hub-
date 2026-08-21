import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Handles Supabase auth callbacks:
 * - Email confirmation (signup)
 * - Magic link sign-in
 * - Password reset
 *
 * Supabase redirects here with ?code=... after the user clicks the email link.
 * We exchange the code for a session, then redirect to the correct dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Where to send the user after confirming — defaults to /
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // setAll called from a Server Component — safe to ignore
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Session established — redirect to the correct dashboard
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single<{ role: string }>()

        const dashboardPath = profile?.role === 'admin' ? '/admin' : '/student'
        return NextResponse.redirect(`${origin}${dashboardPath}`)
      }
    }
  }

  // Something went wrong — send to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
