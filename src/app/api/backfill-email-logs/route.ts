import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { listResendEmails } from '@/lib/email'
import type { EmailType } from '@/lib/types'

// Subjects the send-approval-email route uses, reversed so we can classify a
// Resend email back to its outcome type. Keep in sync with LETTER_CONFIG.
const SUBJECT_TO_TYPE: Record<string, EmailType> = {
  'DRC Protocol Outcome - Approved': 'approved',
  'DRC Protocol Outcome - Minor Amendment Required': 'minor_amendment',
  'DRC Protocol Outcome - Amendment Required': 'major_amendment',
  'DRC Protocol Outcome - Fast Track Review': 'fast_track_rejected',
}

// Which protocols a given outcome email could plausibly belong to, beyond the
// recipient match — used to disambiguate when one applicant has several.
function outcomeMatches(type: EmailType, p: { final_outcome: string | null; fast_tracked: boolean | null }): boolean {
  if (type === 'fast_track_rejected') return !!p.fast_tracked
  return p.final_outcome === type
}

const norm = (s: string) => s.trim().toLowerCase()
const stripTest = (subject: string) => subject.replace(/^\[TEST\]\s*/, '')

/**
 * Reconcile historical outcome emails from Resend into email_logs, so protocols
 * emailed before send-logging existed still show a "sent" pill. Idempotent:
 * already-logged Resend messages are skipped. Conservative: an email whose
 * recipient matches several candidate protocols is left for manual handling
 * rather than guessed.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [{ data: protocols }, { data: existingLogs }, emails] = await Promise.all([
    supabase.from('protocols').select('id, applicant_email, final_outcome, fast_tracked'),
    supabase.from('email_logs').select('resend_message_id').not('resend_message_id', 'is', null),
    listResendEmails(),
  ])

  const alreadyLoggedIds = new Set((existingLogs ?? []).map(l => l.resend_message_id as string))

  // Index protocols by normalised applicant email.
  const byEmail = new Map<string, { id: string; final_outcome: string | null; fast_tracked: boolean | null }[]>()
  for (const p of protocols ?? []) {
    if (!p.applicant_email) continue
    const key = norm(p.applicant_email)
    const list = byEmail.get(key) ?? []
    list.push({ id: p.id, final_outcome: p.final_outcome, fast_tracked: p.fast_tracked })
    byEmail.set(key, list)
  }

  const summary = { scanned: emails.length, linked: 0, alreadyLogged: 0, ambiguous: 0, unmatched: 0, notOutcome: 0 }

  for (const email of emails) {
    const type = SUBJECT_TO_TYPE[stripTest(email.subject)]
    if (!type) { summary.notOutcome++; continue }
    if (email.id && alreadyLoggedIds.has(email.id)) { summary.alreadyLogged++; continue }

    // Any recipient of this email that maps to a protocol.
    const candidates = email.to
      .flatMap(addr => byEmail.get(norm(addr)) ?? [])
      .filter(p => outcomeMatches(type, p))

    // Dedupe candidate protocol ids.
    const unique = [...new Map(candidates.map(c => [c.id, c])).values()]

    if (unique.length === 0) { summary.unmatched++; continue }
    if (unique.length > 1) { summary.ambiguous++; continue }

    const { error } = await supabase.from('email_logs').insert({
      protocol_id: unique[0].id,
      sent_by: user.id,
      recipient_email: email.to[0] ?? '',
      email_type: type,
      subject: stripTest(email.subject),
      resend_message_id: email.id,
      delivery_status: email.last_event,
      delivery_checked_at: new Date().toISOString(),
      sent_at: email.created_at,
    })
    if (error) {
      // Unique-index collision => already logged by a concurrent run; count it.
      if (error.code === '23505') { summary.alreadyLogged++; continue }
      console.error('backfill insert failed:', error.message)
      continue
    }
    alreadyLoggedIds.add(email.id)
    summary.linked++
  }

  return NextResponse.json(summary)
}
