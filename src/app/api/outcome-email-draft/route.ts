import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { buildOutcomeEmailDraft, LETTER_CONFIG } from '@/lib/outcome-email'
import type { EmailType } from '@/lib/types'

/**
 * Pre-filled outcome email for the chair's compose dialog.
 *
 * Applies exactly the same gates as the send route, so the dialog can never
 * present a draft that the subsequent send would reject.
 *
 * Storage paths are deliberately not returned — the client only ever sees
 * `{ reviewId, filename }`, so it has no object reference to tamper with.
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const protocolId = searchParams.get('protocolId')
  const letterType = searchParams.get('letterType') as EmailType | null

  if (!protocolId) return NextResponse.json({ error: 'protocolId required' }, { status: 400 })
  if (!letterType || !LETTER_CONFIG[letterType]) {
    return NextResponse.json({ error: 'Invalid letterType' }, { status: 400 })
  }

  const { data: protocol } = await supabase
    .from('protocols')
    .select('final_outcome, fast_tracked, applicant_email')
    .eq('id', protocolId)
    .single()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })
  if (letterType !== 'fast_track_rejected' && protocol.final_outcome !== letterType) {
    return NextResponse.json({ error: `Protocol outcome is not ${letterType}` }, { status: 400 })
  }
  if (letterType === 'fast_track_rejected' && !protocol.fast_tracked) {
    return NextResponse.json({ error: 'Protocol is not marked as fast tracked' }, { status: 400 })
  }
  if (!protocol.applicant_email) {
    return NextResponse.json({ error: 'No applicant email on record' }, { status: 400 })
  }

  // Reviewer rows and their attachments live behind the service role; the role
  // check above has already authorised this user.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )

  const draft = await buildOutcomeEmailDraft(admin, protocolId, letterType)

  return NextResponse.json({
    to: draft.to,
    subject: draft.subject,
    body: draft.body,
    letterFilename: draft.letterFilename,
    reviewerAttachments: draft.reviewerAttachments.map(a => ({
      reviewId: a.reviewId,
      filename: a.filename,
    })),
  })
}
