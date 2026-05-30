import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { parseEml, type ParsedEml, type ParsedEmlAttachment } from '@/lib/parse-eml'

export const runtime = 'nodejs'

interface FileResult {
  file: string
  status: 'inserted' | 'skipped' | 'error'
  serial_text?: string | null
  submission_id?: string | null
  surname?: string | null
  title?: string | null
  message?: string
}

async function uploadAttachment(
  admin: SupabaseClient,
  att: ParsedEmlAttachment | undefined,
  folder: string,
): Promise<string | null> {
  if (!att) return null
  const safeName = att.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${folder}/${Date.now()}-${safeName}`
  const { error } = await admin.storage
    .from('protocol-submissions')
    .upload(path, att.content, { contentType: att.contentType, upsert: false })
  if (error) throw new Error(`upload ${folder} failed: ${error.message}`)
  return path
}

// Match the attachment that corresponds to a named field value (Drupal can append
// _0 etc., so fall back to a looser match, then to positional order).
function pickAttachment(
  parsed: ParsedEml,
  wantedName: string | null,
  usedIdx: Set<number>,
): ParsedEmlAttachment | undefined {
  const atts = parsed.attachments
  if (wantedName) {
    let i = atts.findIndex((a, idx) => !usedIdx.has(idx) && a.filename === wantedName)
    if (i === -1) i = atts.findIndex((a, idx) => !usedIdx.has(idx) && a.filename.replace(/_\d+(\.\w+)$/, '$1') === wantedName)
    if (i !== -1) { usedIdx.add(i); return atts[i] }
  }
  return undefined
}

export async function POST(req: Request) {
  // auth — executives and admins only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const files = formData.getAll('files').filter((f): f is File => f instanceof File)
  if (files.length === 0) return NextResponse.json({ error: 'No .eml files provided' }, { status: 400 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )

  const results: FileResult[] = []

  for (const file of files) {
    try {
      const parsed = await parseEml(Buffer.from(await file.arrayBuffer()))

      if (!parsed.submissionId) {
        results.push({ file: file.name, status: 'error', message: 'Could not determine submission_id (no file URL found in email).' })
        continue
      }

      // idempotency: skip if this submission_id is already in the database
      const { data: existing } = await admin
        .from('protocols')
        .select('serial_text')
        .eq('submission_id', parsed.submissionId)
        .maybeSingle()
      if (existing) {
        results.push({
          file: file.name, status: 'skipped', submission_id: parsed.submissionId,
          serial_text: existing.serial_text, surname: parsed.surname, title: parsed.title,
          message: 'Already in database — skipped.',
        })
        continue
      }

      // upload the embedded files to the same bucket the live form uses
      const used = new Set<number>()
      const protocolPath      = await uploadAttachment(admin, pickAttachment(parsed, parsed.protocolFileName, used), 'protocols')
      const datasheetPath     = await uploadAttachment(admin, pickAttachment(parsed, parsed.datasheetFileName, used), 'datasheets')
      const supplementaryPath = await uploadAttachment(admin, pickAttachment(parsed, parsed.supplementaryFileName, used), 'supplementary')

      const year = parsed.submittedAt ? parsed.submittedAt.slice(0, 4) : null

      // insert WITHOUT serial_text — trg_auto_serial_text assigns the next YYYY/NNN
      const { data: inserted, error } = await admin
        .from('protocols')
        .insert({
          submission_id:               parsed.submissionId,
          title:                       parsed.title,
          study_type:                  parsed.studyType,
          submission_type:             parsed.submissionType,
          degree:                      parsed.degree,
          fast_tracked:                parsed.fastTracked,
          submitted_at:                parsed.submittedAt,
          applicant_email:             parsed.email,
          applicant_firstname:         parsed.firstname,
          applicant_surname:           parsed.surname,
          applicant_title:             parsed.profTitle,
          supervisor:                  parsed.supervisor,
          protocol_file:               protocolPath ?? parsed.protocolFileName,
          datasheet_file:              datasheetPath ?? parsed.datasheetFileName,
          supplementary_file:          supplementaryPath ?? parsed.supplementaryFileName,
          checklist:                   parsed.checklist,
          if_resubmission_drc_number:  parsed.resubNumber || null,
          final_outcome:               'pending',
          year:                        year,
          year_submitted:              year,
        })
        .select('serial_text')
        .single()

      if (error) throw new Error(error.message)

      results.push({
        file: file.name, status: 'inserted', submission_id: parsed.submissionId,
        serial_text: inserted?.serial_text, surname: parsed.surname, title: parsed.title,
      })
    } catch (e) {
      results.push({ file: file.name, status: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  return NextResponse.json({ results })
}
