import type { SupabaseClient } from '@supabase/supabase-js'

export const BUCKET = 'protocol-submissions'
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB — matches the limit shown to users

/**
 * Upload a file to the protocol-submissions bucket from the browser.
 *
 * The file goes directly to Supabase Storage via a short-lived signed upload
 * URL minted by /api/upload-protocol-file. The bytes never pass through our
 * serverless function, so they aren't subject to its ~4.5 MB request-body limit
 * (which previously rejected larger uploads with a plain-text 413 that the
 * client couldn't parse as JSON). Returns the stored object path.
 */
export async function uploadToBucket(
  supabase: SupabaseClient,
  file: File,
  folder: string,
): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB, over the 10 MB limit.`)
  }

  const res = await fetch('/api/upload-protocol-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, filename: file.name }),
  })
  if (!res.ok) {
    const text = await res.text()
    let message = text
    try { message = JSON.parse(text).error ?? text } catch {}
    throw new Error(`Could not start upload for "${file.name}": ${message}`)
  }
  const { path, token } = await res.json()

  const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(path, token, file)
  if (error) throw new Error(`File upload failed for "${file.name}": ${error.message}`)

  return path
}

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
 * Download a stored object into an email attachment.
 *
 * Returns null when there is no path or the object has gone missing, so callers
 * can skip it and still send rather than failing the whole message. Requires a
 * service-role client — the bucket is private and written with the service role.
 */
export async function downloadAttachment(
  supabase: SupabaseClient,
  storagePath: string | null | undefined,
  filename: string,
): Promise<{ filename: string; content: Buffer } | null> {
  if (!storagePath) return null
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath)
  if (error || !data) return null
  return { filename, content: Buffer.from(await data.arrayBuffer()) }
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
