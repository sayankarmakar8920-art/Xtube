import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY)

// Browser singleton via globalThis to avoid multiple instances
const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined
}

// Only create client if env vars are configured — prevents crash on missing config
function createSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    // Return a no-op client that won't crash but won't connect
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export const supabase: SupabaseClient =
  globalForSupabase.supabase ?? createSupabaseClient()

if (typeof window !== 'undefined') {
  globalForSupabase.supabase = supabase
}

// Admin client — same anon key for now (RLS is public)
// Swap to service_role key when elevated access is needed
export const supabaseAdmin: SupabaseClient = createSupabaseClient()

// ── Storage helpers ──────────────────────────────────────────────

/** Get the public URL for a file in Supabase Storage */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/** Upload a file to Supabase Storage */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  })
  if (error) return { url: null, error: error.message }
  return { url: getPublicUrl(bucket, path), error: null }
}

/** Delete a file from Supabase Storage */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) return { success: false, error: error.message }
  return { success: true, error: null }
}
