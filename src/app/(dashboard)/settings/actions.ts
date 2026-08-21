'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Permanently delete the currently signed-in user's account and all their data.
 *
 * Server actions are untrusted POST entry points, so we re-authenticate inside
 * the action rather than trusting anything from the client (only the caller's
 * own session is ever acted on — no id is accepted as input).
 *
 * Order matters: delete the profile row (and anything cascading from it via
 * FK) first, then remove the auth user with the service-role admin client, then
 * sign the now-orphaned cookie session out. redirect() throws (NEXT_REDIRECT),
 * so it is called last and OUTSIDE the try/catch.
 */
export async function deleteAccount(): Promise<{ error: string } | void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // No session — nothing to delete; just bounce to login.
    redirect('/login')
  }

  try {
    const admin = createAdminClient()

    // Remove the profile row. RLS is bypassed by the service-role client, so
    // this succeeds regardless of policy, and FK cascades clean up owned rows.
    const { error: profileError } = await admin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      return { error: 'Could not delete your profile. Please try again.' }
    }

    // Remove the auth user itself.
    const { error: authError } = await admin.auth.admin.deleteUser(user.id)

    if (authError) {
      return { error: 'Could not delete your account. Please try again.' }
    }

    // Clear the local cookie session (the user no longer exists).
    await supabase.auth.signOut()
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }

  // Outside the try/catch: redirect() throws to interrupt rendering.
  redirect('/login')
}
