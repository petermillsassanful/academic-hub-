import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Service-role Supabase client. This bypasses RLS and can perform auth admin
 * operations (e.g. deleting a user). It MUST only ever be imported by
 * server-side code — the `server-only` import above makes a client bundle that
 * touches this module fail to build. The key is read from a non-public env var
 * and never sent to the browser.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
