'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

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

  // Send assignment notification emails (fire and forget — don't fail the save if email fails)
  if (toInsert.length > 0) {
    sendAssignmentEmails(supabase, protocolId, toInsert.map(r => r.reviewer_id)).catch(() => {})
  }

  return {}
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

  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  for (const reviewer of reviewers) {
    if (!reviewer.email || reviewer.email.endsWith('@drc.local')) continue
    const salutation = [reviewer.professional_title, reviewer.surname].filter(Boolean).join(' ')
    await resend.emails.send({
      from: 'DRC <onboarding@resend.dev>',
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
  }
}
