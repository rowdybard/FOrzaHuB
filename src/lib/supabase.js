import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True when Supabase credentials are present. When false, the app should fall
 * back to the local mock data in `src/data/mock.js`. This lets the UI run with
 * zero configuration during development and on a fresh Cloudflare Pages deploy.
 */
export const isSupabaseEnabled = Boolean(url && anonKey)

/**
 * Shared Supabase client. `null` when credentials are not configured — always
 * guard usage with `isSupabaseEnabled` or optional chaining.
 */
export const supabase = isSupabaseEnabled
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
