import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'protocol-submissions'
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour

/**
 * Resolve a stored file reference to a download URL.
 *
 * Accepts either an absolute http(s) URL (legacy/external) or a path inside
 * the protocol-submissions bucket (new uploads). Paths are turned into a
 * short-lived signed URL.
 */
export async function resolveStorageLink(
  supabase: SupabaseClient,
  value: string | null | undefined,
): Promise<string | null> {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(value, SIGNED_URL_TTL_SECONDS)
  return data?.signedUrl ?? null
}

/**
 * Display name for a stored reference. Strips bucket folders and timestamp
 * prefixes added by the upload route so the user sees the original filename.
 */
export function storageDisplayName(value: string | null | undefined): string {
  if (!value) return ''
  const last = decodeURIComponent(value.split('/').pop() ?? value)
  // upload route prefixes with `${Date.now()}-`; strip if present
  return last.replace(/^\d{10,}-/, '')
}
