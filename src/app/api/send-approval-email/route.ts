import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { downloadAttachment } from '@/lib/storage'
import { buildOutcomeEmailDraft, LETTER_CONFIG, MAX_ATTACHMENT_BYTES } from '@/lib/outcome-email'
import type { EmailType } from '@/lib/types'
import { renderToBuffer } from '@react-pdf/renderer'
import { ApprovalLetterPDF } from '@/lib/approval-letter-pdf'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createElement } from 'react'

// Defensive ceiling on the chair-supplied text. Generous enough for a long
// set of reviewer comments, small enough that a runaway client can't post a
// novel into an email body.
const MAX_SUBJECT_CHARS = 500
const MAX_BODY_CHARS = 100_000

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { protocolId, letterType, subject, body, reviewAttachmentIds } = await req.json()
  if (!protocolId) return NextResponse.json({ error: 'protocolId required' }, { status: 400 })

  const type = letterType as EmailType
  const config = LETTER_CONFIG[type]
  if (!config) return NextResponse.json({ error: 'Invalid letterType' }, { status: 400 })

  const [{ data: protocol }, { data: chair }] = await Promise.all([
    supabase.from('protocols').select('*').eq('id', protocolId).single(),
    supabase.from('profiles')
      .select('professional_title, firstname, surname, email, signature_url')
      .eq('portfolio', 'Chairperson')
      .single(),
  ])

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })
  if (type !== 'fast_track_rejected' && protocol.final_outcome !== type) {
    return NextResponse.json({ error: `Protocol outcome is not ${type}` }, { status: 400 })
  }
  if (type === 'fast_track_rejected' && !protocol.fast_tracked) {
    return NextResponse.json({ error: 'Protocol is not marked as fast tracked' }, { status: 400 })
  }
  if (!protocol.applicant_email) return NextResponse.json({ error: 'No applicant email on record' }, { status: 400 })

  // Reviewer rows and their attachment bytes live behind the service role; an
  // executive's own client cannot read the private bucket. The role check above
  // has already authorised this user.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )

  // The draft is the fallback for anything the chair didn't override, and the
  // authority on which review maps to which anonymised filename.
  const draft = await buildOutcomeEmailDraft(admin, protocolId, type)

  const finalSubject = typeof subject === 'string' && subject.trim()
    ? subject.trim().slice(0, MAX_SUBJECT_CHARS)
    : draft.subject
  const finalBody = typeof body === 'string' && body.trim()
    ? body.slice(0, MAX_BODY_CHARS)
    : draft.body

  // Only ids the client was actually offered are honoured, and `draft` was
  // built from this protocol's reviews alone — so a forged id selects nothing
  // and no arbitrary object can be pulled out of the bucket.
  const selectedIds: string[] | null = Array.isArray(reviewAttachmentIds)
    ? reviewAttachmentIds.filter((v: unknown): v is string => typeof v === 'string')
    : null
  const chosen = selectedIds
    ? draft.reviewerAttachments.filter(a => selectedIds.includes(a.reviewId))
    : []

  const uctLogoBase64 = readFileSync(join(process.cwd(), 'public', 'uct-shield.png')).toString('base64')
  const drcLogoBase64 = readFileSync(join(process.cwd(), 'public', 'drc-logo.png')).toString('base64')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    createElement(ApprovalLetterPDF, { protocol, chair, uctLogoBase64, drcLogoBase64, letterType: type }) as any
  )

  const serial = protocol.serial_text ?? protocolId

  const reviewerFiles = await Promise.all(
    chosen.map(a => downloadAttachment(admin, a.storagePath, a.filename))
  )
  // A document whose object has gone missing is reported rather than silently
  // dropped — but it must not block the letter the applicant is waiting for.
  const skipped = chosen
    .filter((_, i) => reviewerFiles[i] === null)
    .map(a => a.filename)
  const attached = reviewerFiles.filter((f): f is { filename: string; content: Buffer } => f !== null)

  const attachments = [
    { filename: config.filename(serial), content: pdfBuffer },
    ...attached,
  ]

  const totalBytes = attachments.reduce((sum, a) => sum + a.content.length, 0)
  if (totalBytes > MAX_ATTACHMENT_BYTES) {
    const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`
    return NextResponse.json({
      error: `Attachments total ${mb(totalBytes)}, over the ${mb(MAX_ATTACHMENT_BYTES)} limit. Untick some reviewer documents and send them separately.`,
    }, { status: 400 })
  }

  const { data: sendData, error } = await sendEmail({
    to: protocol.applicant_email,
    subject: finalSubject,
    text: finalBody,
    attachments,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Record the send so the chair sees a persistent "email sent" pill and can
  // later verify delivery with Resend. The body and attachment names are kept
  // because they are now editable — without them there'd be no record of what
  // actually went to the applicant. Best-effort: a logging failure must not
  // fail the send the applicant already received.
  const baseLog = {
    protocol_id: protocolId,
    sent_by: user.id,
    recipient_email: protocol.applicant_email,
    email_type: type,
    subject: finalSubject,
    resend_message_id: sendData?.id ?? null,
    delivery_status: 'sent',
  }

  const { error: logError } = await supabase.from('email_logs').insert({
    ...baseLog,
    body: finalBody,
    attachment_names: attachments.map(a => a.filename),
  })

  if (logError) {
    // `body`/`attachment_names` arrive with supabase/add-email-log-body.sql. If
    // the code is deployed before that migration runs, fall back to the columns
    // that have always existed — losing the audit detail is acceptable, but
    // losing the row would silently break the chair's delivery-status pill.
    console.error('email_logs insert failed:', logError.message)
    const { error: retryError } = await supabase.from('email_logs').insert(baseLog)
    if (retryError) console.error('email_logs fallback insert failed:', retryError.message)
  }

  return NextResponse.json({ success: true, skipped })
}
