'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'

export async function saveAssignments(
  protocolId: string,
  reviewer1Id: string,
  reviewer2Id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return { error: 'Unauthorized' }
  }

  // Capture existing reviewers BEFORE wiping, so we can email only the
  // newly-added ones after the save.
  const { data: existing } = await supabase
    .from('protocol_assignments')
    .select('reviewer_id')
    .eq('protocol_id', protocolId)
  const previousReviewerIds = new Set((existing ?? []).map(r => r.reviewer_id))

  const { error: deleteError } = await supabase
    .from('protocol_assignments')
    .delete()
    .eq('protocol_id', protocolId)

  if (deleteError) return { error: `Delete failed: ${deleteError.message}` }

  const toInsert: { protocol_id: string; reviewer_id: string; assigned_by: string; status: string }[] = []
  if (reviewer1Id) toInsert.push({ protocol_id: protocolId, reviewer_id: reviewer1Id, assigned_by: user.id, status: 'pending' })
  if (reviewer2Id && reviewer2Id !== reviewer1Id) toInsert.push({ protocol_id: protocolId, reviewer_id: reviewer2Id, assigned_by: user.id, status: 'pending' })

  if (toInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('protocol_assignments')
      .insert(toInsert)
      .select()
    if (insertError) return { error: `Insert failed: ${insertError.message}` }
    if (!inserted || inserted.length !== toInsert.length) {
      return { error: `Insert silent-failed: expected ${toInsert.length} rows, got ${inserted?.length ?? 0}.` }
    }
  }

  revalidatePath(`/dashboard/executive/protocols/${protocolId}`)
  revalidatePath('/dashboard/executive')

  // Email only reviewers who weren't already assigned to this protocol.
  const newlyAssignedIds = toInsert
    .map(r => r.reviewer_id)
    .filter(id => !previousReviewerIds.has(id))

  if (newlyAssignedIds.length > 0) {
    sendAssignmentEmails(supabase, protocolId, newlyAssignedIds)
      .catch(err => console.error('Assignment emails failed:', err))
  }

  return {}
}

export async function declineAssignment(
  assignmentId: string,
  reason: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Load the assignment + protocol + the declining reviewer's profile in one round-trip.
  const { data: assignment } = await supabase
    .from('protocol_assignments')
    .select(`
      id, reviewer_id, protocol_id,
      protocol:protocols(title, serial_text, meeting_date)
    `)
    .eq('id', assignmentId)
    .single()

  if (!assignment) return { error: 'Assignment not found' }
  if (assignment.reviewer_id !== user.id) return { error: 'Unauthorized' }

  // Authorization is already enforced above (reviewer_id === user.id), so we
  // use the admin client to bypass RLS for the actual UPDATE — Supabase
  // silently affects 0 rows when RLS denies, which would leave the user
  // thinking their decline persisted.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )

  const { data: updated, error: updateError } = await admin
    .from('protocol_assignments')
    .update({ status: 'declined' })
    .eq('id', assignmentId)
    .select()

  if (updateError) return { error: `Decline failed: ${updateError.message}` }
  if (!updated || updated.length === 0) return { error: 'Decline did not persist' }

  revalidatePath('/dashboard/reviewer')
  revalidatePath(`/dashboard/executive/protocols/${assignment.protocol_id}`)
  revalidatePath('/dashboard/executive')

  // Notify chair (fire and forget)
  sendDeclineEmail(supabase, user.id, assignment, reason)
    .catch(err => console.error('Decline email failed:', err))

  return {}
}

async function sendDeclineEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reviewerId: string,
  assignment: { protocol_id: string; protocol: { title: string | null; serial_text: string | null; meeting_date: string | null } | { title: string | null; serial_text: string | null; meeting_date: string | null }[] | null },
  reason: string,
) {
  const [{ data: reviewer }, { data: chair }] = await Promise.all([
    supabase.from('profiles').select('professional_title, firstname, surname').eq('id', reviewerId).single(),
    supabase.from('profiles').select('email, professional_title, firstname, surname').eq('portfolio', 'Chairperson').single(),
  ])

  if (!chair?.email || chair.email.endsWith('@drc.local')) return

  const protocol = Array.isArray(assignment.protocol) ? assignment.protocol[0] : assignment.protocol
  const reviewerName = reviewer
    ? [reviewer.professional_title, reviewer.firstname, reviewer.surname].filter(Boolean).join(' ')
    : 'A reviewer'
  const chairSalutation = [chair.professional_title, chair.surname].filter(Boolean).join(' ')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { error } = await sendEmail({
    to: chair.email,
    subject: `DRC Protocol Review Declined – ${protocol?.serial_text ?? assignment.protocol_id}`,
    text: `Dear ${chairSalutation}

${reviewerName} has declined to review the following protocol:

Protocol No.: ${protocol?.serial_text ?? '—'}
Title: ${protocol?.title ?? 'Untitled Protocol'}
${protocol?.meeting_date ? `Meeting Date: ${protocol.meeting_date}` : ''}
${reason ? `\nReason given:\n${reason}\n` : ''}
Please log in to assign a replacement reviewer:
${appUrl}/dashboard/executive/protocols/${assignment.protocol_id}

Kind regards
DRC Protocol Review System`,
  })
  if (error) console.error('Decline notification to chair failed:', error)
}

async function sendAssignmentEmails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  protocolId: string,
  reviewerIds: string[],
) {
  const [{ data: protocol }, { data: reviewers }, { data: chair }] = await Promise.all([
    supabase.from('protocols').select('title, serial_text, meeting_date').eq('id', protocolId).single(),
    supabase.from('profiles').select('email, professional_title, firstname, surname').in('id', reviewerIds),
    supabase.from('profiles').select('professional_title, firstname, surname').eq('portfolio', 'Chairperson').single(),
  ])

  if (!protocol || !reviewers) return

  const chairName = chair
    ? [chair.professional_title, chair.firstname, chair.surname].filter(Boolean).join(' ')
    : 'Dr Claire Warden'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  for (const reviewer of reviewers) {
    if (!reviewer.email || reviewer.email.endsWith('@drc.local')) continue
    const salutation = [reviewer.professional_title, reviewer.surname].filter(Boolean).join(' ')
    const { error } = await sendEmail({
      to: reviewer.email,
      subject: `DRC Protocol Assigned – ${protocol.serial_text ?? protocolId}`,
      text: `Dear ${salutation}

You have been assigned to review the following protocol:

Protocol No.: ${protocol.serial_text ?? '—'}
Title: ${protocol.title ?? 'Untitled Protocol'}
${protocol.meeting_date ? `Meeting Date: ${protocol.meeting_date}` : ''}

Please log in to the DRC Protocol Review system to submit your review:
${appUrl}/dashboard/reviewer

Kind regards
${chairName}
Chair: Surgical DRC`,
    })
    if (error) console.error(`Assignment email to ${reviewer.email} failed:`, error)
  }
}
