import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

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

  const { date, apologyIds } = await req.json() as { date: string; apologyIds: string[] }
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const [
    { data: protocols },
    { data: allReviewers },
    { data: chair },
    { data: nextMeetingRows },
  ] = await Promise.all([
    supabase.from('protocols')
      .select('id, serial_text, title, applicant_title, applicant_firstname, applicant_surname, applicant_email, fast_tracked')
      .eq('omit_record', false)
      .or(`meeting_date.eq.${date},meeting_date.like.${date}%`)
      .order('fast_tracked', { ascending: false })
      .order('serial_text'),
    supabase.from('profiles')
      .select('id, professional_title, firstname, surname, email')
      .in('role', ['reviewer', 'executive', 'admin'])
      .eq('archived', false)
      .order('surname'),
    supabase.from('profiles')
      .select('professional_title, firstname, surname, email')
      .eq('portfolio', 'Chairperson')
      .single(),
    supabase.from('meeting_dates')
      .select('meeting_date')
      .gt('meeting_date', date)
      .order('meeting_date')
      .limit(1),
  ])

  const fastTracked = (protocols ?? []).filter(p => p.fast_tracked)
  const forReview = (protocols ?? []).filter(p => !p.fast_tracked)
  const apologisedNames = (allReviewers ?? [])
    .filter(r => (apologyIds ?? []).includes(r.id))
    .map(r => [r.professional_title, r.firstname, r.surname].filter(Boolean).join(' '))
  const chairName = chair ? [chair.professional_title, chair.firstname, chair.surname].filter(Boolean).join(' ') : 'Dr Claire Warden'
  const chairEmail = chair?.email ?? 'claire.warden@uct.ac.za'
  const nextMeeting = nextMeetingRows?.[0]?.meeting_date ? fmtDate(String(nextMeetingRows[0].meeting_date)) : null
  const meetingDateFormatted = fmtDate(date)

  // Build recipient list: all reviewer emails + applicant emails for this meeting's protocols
  const reviewerEmails = (allReviewers ?? [])
    .filter(r => r.email && !r.email.endsWith('@drc.local'))
    .map(r => r.email)
  const applicantEmails = (protocols ?? [])
    .filter(p => p.applicant_email && !p.applicant_email.endsWith('@drc.local'))
    .map(p => p.applicant_email as string)
  const allRecipients = [...new Set([...reviewerEmails, ...applicantEmails])]

  if (allRecipients.length === 0) {
    return NextResponse.json({ error: 'No valid email addresses found' }, { status: 400 })
  }

  // Build agenda text
  let fastSection = '4. Fast-Tracked Protocols\n'
  if (fastTracked.length === 0) {
    fastSection += '   None\n'
  } else {
    fastTracked.forEach((p, i) => {
      const initial = p.applicant_firstname?.[0] ? `${p.applicant_firstname[0].toUpperCase()} ` : ''
      const applicant = [p.applicant_title, `${initial}${(p.applicant_surname ?? '').toUpperCase()}`].filter(Boolean).join(' ')
      fastSection += `   4.${i + 1} ${applicant} (Protocol No.: ${p.serial_text ?? '—'})\n   ${p.title ?? ''}\n`
    })
  }

  let reviewSection = '5. Protocols For Review (14:00)\n'
  if (forReview.length === 0) {
    reviewSection += '   None\n'
  } else {
    forReview.forEach((p, i) => {
      const initial = p.applicant_firstname?.[0] ? `${p.applicant_firstname[0]} ` : ''
      const applicant = [p.applicant_title, `${initial}${p.applicant_surname ?? ''}`].filter(Boolean).join(' ')
      reviewSection += `   5.${i + 1} ${applicant} (Protocol No.: ${p.serial_text ?? '—'})\n   ${p.title ?? ''}\n`
    })
  }

  const reviewerNames = (allReviewers ?? []).map(r => [r.professional_title, r.firstname, r.surname].filter(Boolean).join(' '))
  const applicantNames = (protocols ?? []).map(p => [p.applicant_title, p.applicant_firstname, p.applicant_surname].filter(Boolean).join(' '))
  const sentTo = [...reviewerNames, ...applicantNames].join(', ')

  const emailBody = `UNIVERSITY OF CAPE TOWN
DEPARTMENT OF SURGERY RESEARCH COMMITTEE

13:30 Committee Members only
13:45 Investigators
${meetingDateFormatted}
Venue: via Zoom

Should you be unable to attend and wish to have your apologies recorded, email ${chairEmail}

AGENDA

1. Apologies
${apologisedNames.length > 0 ? '   ' + apologisedNames.join(', ') : '   None recorded'}

2. Minutes of Previous Meeting

3. Matters of Urgency

${fastSection}
${reviewSection}
6. Agenda Sent to: ${sentTo}
${nextMeeting ? `\nNext Meeting ${nextMeeting}` : ''}

Yours sincerely

${chairName.toUpperCase()}
CHAIR: SURGICAL DRC

"OUR MISSION is to be an outstanding teaching and research university, educating for life and addressing the challenges facing our society."`

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: 'DRC <onboarding@resend.dev>',
    to: allRecipients,
    subject: `DRC Meeting Agenda – ${meetingDateFormatted}`,
    text: emailBody,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log to email_logs
  for (const recipient of allRecipients) {
    await supabase.from('email_logs').insert({
      sent_by: user.id,
      recipient_email: recipient,
      email_type: 'agenda',
    })
  }

  return NextResponse.json({ success: true, sent: allRecipients.length })
}
