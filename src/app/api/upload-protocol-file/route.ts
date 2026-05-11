import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folder = formData.get('folder') as string | null

  if (!file || !folder) {
    return NextResponse.json({ error: 'Missing file or folder' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${folder}/${Date.now()}-${safeName}`
  const bytes = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('protocol-submissions')
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ path })
}
