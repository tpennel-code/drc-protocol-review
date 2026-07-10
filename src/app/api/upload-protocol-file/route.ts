import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BUCKET } from '@/lib/storage'

// Folders the submit form is allowed to upload into. Restricting this stops the
// path from being used to write anywhere else in the bucket.
const ALLOWED_FOLDERS = new Set(['protocols', 'datasheets', 'supplementary', 'reviews'])

/**
 * Issue a short-lived signed upload URL so the browser can upload the file
 * directly to Supabase Storage. The file bytes never pass through this
 * function, which avoids the serverless request-body limit (~4.5 MB) that
 * previously rejected larger uploads with a plain-text 413 ("Request Entity
 * Too Large") that the client then failed to parse as JSON.
 */
export async function POST(req: Request) {
  let body: { folder?: unknown; filename?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const folder = typeof body.folder === 'string' ? body.folder : ''
  const filename = typeof body.filename === 'string' ? body.filename : ''

  if (!ALLOWED_FOLDERS.has(folder) || !filename) {
    return NextResponse.json({ error: 'Missing or invalid folder/filename' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${folder}/${Date.now()}-${safeName}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ path: data.path, token: data.token })
}
