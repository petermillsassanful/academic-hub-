import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

/**
 * Cached auth helpers — React `cache()` deduplicates calls within
 * a single server-component render tree, so the layout and page
 * share the same result without extra network round-trips.
 */

export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export const getProfile = cache(async () => {
  const user = await getUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()
  return data
})
