import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { meetingDate } = await req.json() as { meetingDate?: string }

  // Find all assignments where reviewer has NOT submitted a review,
  // for protocols scheduled for the given meeting date (or all upcoming if none specified)
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('protocol_assignments')
    .select(`
      reviewer_id,
      protocol:protocols!protocol_id(id, title, serial_text, meeting_date),
      reviewer:profiles!reviewer_id(email, professional_title, firstname, surname)
    `)
    .eq('status', 'pending')

  const { data: assignments } = await query

  if (!assignments) return NextResponse.json({ sent: 0 })

  // Filter: protocol has an upcoming meeting date, reviewer hasn't submitted
  const { data: submittedReviews } = await supabase
    .from('reviews')
    .select('protocol_id, reviewer_id')

  const submittedSet = new Set(
    (submittedReviews ?? []).map(r => `${r.protocol_id}:${r.reviewer_id}`)
  )

  const { data: chair } = await supabase
    .from('profiles')
    .select('professional_title, firstname, surname')
    .eq('portfolio', 'Chairperson')
    .single()

  const chairName = chair
    ? [chair.professional_title, chair.firstname, chair.surname].filter(Boolean).join(' ')
    : 'Dr Claire Warden'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  let sent = 0
  const skipped: string[] = []

  for (const a of assignments) {
    const protocol = a.protocol as { id: string; title: string | null; serial_text: string | null; meeting_date: string | null } | null
    const reviewer = a.reviewer as { email: string | null; professional_title: string | null; firstname: string | null; surname: string | null } | null

    if (!protocol || !reviewer) continue
    if (!reviewer.email || reviewer.email.endsWith('@drc.local')) { skipped.push(reviewer.email ?? ''); continue }

    // Skip if meeting date is in the past or no meeting date
    if (!protocol.meeting_date) continue
    const meetingStr = String(protocol.meeting_date).replace(/[T ].*/, '')
    if (meetingStr < today) continue

    // Skip if a specific meeting date was requested and this doesn't match
    if (meetingDate && meetingStr !== meetingDate) continue

    // Skip if already submitted
    if (submittedSet.has(`${protocol.id}:${a.reviewer_id}`)) continue

    const salutation = [reviewer.professional_title, reviewer.surname].filter(Boolean).join(' ')

    await sendEmail({
      to: reviewer.email,
      subject: `DRC Review Reminder – ${protocol.serial_text ?? protocol.id}`,
      text: `Dear ${salutation}

This is a reminder that you have a protocol review outstanding for the upcoming DRC meeting.

Protocol No.: ${protocol.serial_text ?? '—'}
Title: ${protocol.title ?? 'Untitled Protocol'}
Meeting Date: ${fmtDate(meetingStr)}

Please log in and submit your review before the meeting:
${appUrl}/dashboard/reviewer

Kind regards
${chairName}
Chair: Surgical DRC`,
    })

    await supabase.from('email_logs').insert({
      protocol_id: protocol.id,
      sent_by: user.id,
      recipient_email: reviewer.email,
      email_type: 'reminder',
    })

    sent++
  }

  return NextResponse.json({ success: true, sent, skipped: skipped.length })
}
