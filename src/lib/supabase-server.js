import { createClient } from '@supabase/supabase-js'

/**
 * Create a server-side Supabase client using the anon/publishable key.
 * This client respects RLS policies — unauthenticated access only sees
 * public data, exactly as the browser client does.
 *
 * @param {string} url - Supabase project URL
 * @param {string} anonKey - Supabase anon/publishable key
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createServerClient(url, anonKey) {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
