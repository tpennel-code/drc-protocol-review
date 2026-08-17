import type { SupabaseClient } from '@supabase/supabase-js'
import type { EmailType } from '@/lib/types'
import { storageDisplayName } from '@/lib/storage'

/**
 * Subject line, body sentence and PDF filename for each outcome letter.
 *
 * Single source of truth: both the draft endpoint (which pre-fills the chair's
 * compose dialog) and the send route read from here, so the message she sees
 * and the message that goes out can never drift apart.
 */
export const LETTER_CONFIG: Record<EmailType, {
  subject: string
  bodyLine: string
  filename: (serial: string) => string
}> = {
  approved: {
    subject: 'DRC Protocol Outcome - Approved',
    bodyLine: 'Please see the attached approval letter.',
    filename: (serial: string) => `DRC_Approval_${serial}.pdf`,
  },
  minor_amendment: {
    subject: 'DRC Protocol Outcome - Minor Amendment Required',
    bodyLine: 'Please see the attached minor amendment letter.',
    filename: (serial: string) => `DRC_Minor_Amendment_${serial}.pdf`,
  },
  major_amendment: {
    subject: 'DRC Protocol Outcome - Amendment Required',
    bodyLine: 'Please see the attached amendment letter.',
    filename: (serial: string) => `DRC_Amendment_${serial}.pdf`,
  },
  fast_track_rejected: {
    subject: 'DRC Protocol Outcome - Fast Track Review',
    bodyLine: 'Please see the attached letter regarding your fast track submission.',
    filename: (serial: string) => `DRC_FastTrack_${serial}.pdf`,
  },
}

/**
 * Resend accepts 40 MB per email *after* Base64 encoding, which inflates bytes
 * by ~4/3 — roughly a 30 MB raw budget. Receiving gateways are typically
 * stricter (25 MB is a common institutional cap), so we guard well below both
 * and tell the chair to untick documents rather than let the send fail opaquely
 * or bounce silently at the recipient's server.
 */
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024

/** A reviewer's uploaded markup document, offered as an optional attachment. */
export type ReviewerAttachment = {
  reviewId: string
  storagePath: string
  /** Anonymised and collision-proof, e.g. "Reviewer 2 - tracked changes.docx". */
  filename: string
}

export type OutcomeEmailDraft = {
  to: string
  subject: string
  body: string
  reviewerAttachments: ReviewerAttachment[]
  /** Filename of the always-attached generated letter, for display only. */
  letterFilename: string
}

type ReviewRow = {
  id: string
  comments: string | null
  attachment_path: string | null
}

/**
 * Build the pre-filled outcome email for a protocol.
 *
 * Reviews are numbered in a stable order (oldest submission first, id as the
 * tie-break) so that "Reviewer 2" in the body and "Reviewer 2 - markup.docx" in
 * the attachments always refer to the same person — and so the numbering the
 * chair sees when the dialog opens still matches when she sends.
 *
 * Reviewers are anonymised: the applicant sees "Reviewer 1", never a name.
 *
 * Requires a service-role client. The `protocol-submissions` bucket is private
 * and its objects are written with the service role, so an executive's own
 * cookie-bound client cannot read them.
 */
export async function buildOutcomeEmailDraft(
  supabase: SupabaseClient,
  protocolId: string,
  letterType: EmailType,
): Promise<OutcomeEmailDraft> {
  const config = LETTER_CONFIG[letterType]

  const [{ data: protocol }, { data: chair }, { data: reviews }] = await Promise.all([
    supabase.from('protocols').select('*').eq('id', protocolId).single(),
    supabase.from('profiles')
      .select('professional_title, firstname, surname')
      .eq('portfolio', 'Chairperson')
      .single(),
    supabase.from('reviews')
      .select('id, comments, attachment_path')
      .eq('protocol_id', protocolId)
      .order('submitted_at', { ascending: true })
      .order('id', { ascending: true }),
  ])

  if (!protocol) throw new Error('Protocol not found')

  const chairName = chair
    ? [chair.professional_title, chair.firstname, chair.surname].filter(Boolean).join(' ')
    : 'Claire Warden'

  const salutation = [protocol.applicant_title, protocol.applicant_surname].filter(Boolean).join(' ')
  const projectTitle = protocol.approved_title || protocol.title || ''
  const serial = protocol.serial_text ?? protocolId

  // Number every review, not just the ones with comments or files, so a
  // reviewer's comments and their document always carry the same number.
  const numbered = (reviews ?? []).map((r: ReviewRow, i: number) => ({ ...r, label: `Reviewer ${i + 1}` }))

  const withComments = numbered.filter(r => r.comments?.trim())
  const commentsBlock = withComments.length
    ? `REVIEWER COMMENTS\n\n${withComments
        .map(r => `${r.label}:\n${r.comments!.trim()}`)
        .join('\n\n')}\n\n`
    : ''

  const body =
    `Dear ${salutation}\n\n` +
    `Thank you for submitting your protocol entitled: '${projectTitle}'.  ${config.bodyLine}\n\n` +
    commentsBlock +
    `Kind Regards\n${chairName}\n`

  const reviewerAttachments: ReviewerAttachment[] = numbered
    .filter(r => r.attachment_path)
    .map(r => ({
      reviewId: r.id,
      storagePath: r.attachment_path!,
      // Prefixing with the reviewer label keeps the applicant's view anonymous
      // and stops two reviewers who uploaded "comments.docx" from colliding.
      filename: `${r.label} - ${storageDisplayName(r.attachment_path)}`,
    }))

  return {
    to: protocol.applicant_email ?? '',
    subject: config.subject,
    body,
    reviewerAttachments,
    letterFilename: config.filename(serial),
  }
}
