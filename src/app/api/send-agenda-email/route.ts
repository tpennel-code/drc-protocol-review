import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { renderAgendaPdf } from '@/lib/agenda-pdf-render'

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function fmtDateShort(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

function fmtDateLong(iso: string) {
  const d = new Date(iso)
  return `${DAYS_LONG[d.getUTCDay()]}, ${ordinal(d.getUTCDate())} ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`
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
      .select('professional_title, firstname, surname, email, signature_url')
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

  const chairName = chair
    ? [chair.professional_title, chair.firstname, chair.surname].filter(Boolean).join(' ')
    : 'Dr Claire Warden'
  const chairFirstLast = chair
    ? [chair.firstname, chair.surname].filter(Boolean).join(' ')
    : 'Claire Warden'
  const chairEmail = chair?.email ?? 'claire.warden@uct.ac.za'

  const nextMeetingRaw = nextMeetingRows?.[0]?.meeting_date ? String(nextMeetingRows[0].meeting_date) : null
  const nextMeeting = nextMeetingRaw ? fmtDateShort(nextMeetingRaw) : null
  const nextMeetingMonth = nextMeetingRaw ? MONTHS_LONG[new Date(nextMeetingRaw).getUTCMonth()] : null

  const meetingDateFormatted = fmtDateShort(date)
  const meetingDateLong = fmtDateLong(date)
  const meetingDayOfWeek = DAYS_LONG[new Date(date).getUTCDay()]

  // Recipients: applicants → To, committee reviewers → Cc.
  // If someone is both an applicant and a reviewer, drop them from Cc to avoid duplicate.
  const hasRealEmail = (e: string | null | undefined) => !!e && !e.endsWith('@drc.local')
  const applicantEmails = Array.from(new Set(
    (protocols ?? [])
      .filter(p => hasRealEmail(p.applicant_email))
      .map(p => p.applicant_email as string)
  ))
  const reviewerEmails = Array.from(new Set(
    (allReviewers ?? [])
      .filter(r => hasRealEmail(r.email))
      .map(r => r.email as string)
  ))

  // If there are no applicants on this meeting, send to reviewers as To
  const toEmails = applicantEmails.length > 0 ? applicantEmails : reviewerEmails
  const ccEmails = applicantEmails.length > 0
    ? reviewerEmails.filter(e => !applicantEmails.includes(e))
    : []
  const allRecipients = [...toEmails, ...ccEmails]

  if (allRecipients.length === 0) {
    return NextResponse.json({ error: 'No valid email addresses found' }, { status: 400 })
  }

  // Names list for the PDF: full committee + all applicants (regardless of deliverability)
  const reviewerNames = (allReviewers ?? []).map(r =>
    [r.professional_title, r.firstname, r.surname].filter(Boolean).join(' ')
  )
  const applicantNames = (protocols ?? []).map(p =>
    [p.applicant_title, p.applicant_firstname, p.applicant_surname].filter(Boolean).join(' ')
  )
  const agendaSentTo = [...reviewerNames, ...applicantNames].join(', ')

  // People who appear in "Agenda Sent to" but won't receive the email (placeholder/missing email)
  const skipped: string[] = [
    ...(allReviewers ?? [])
      .filter(r => !hasRealEmail(r.email))
      .map(r => [r.professional_title, r.firstname, r.surname].filter(Boolean).join(' ')),
    ...(protocols ?? [])
      .filter(p => !hasRealEmail(p.applicant_email))
      .map(p => [p.applicant_title, p.applicant_firstname, p.applicant_surname].filter(Boolean).join(' ')),
  ]

  // Render the agenda PDF
  const pdfBuffer = await renderAgendaPdf({
    meetingDateFormatted,
    apologisedNames,
    fastTracked,
    forReview,
    agendaSentTo,
    nextMeeting,
    chairName,
    chairEmail,
    signatureUrl: chair?.signature_url ?? null,
  })

  const emailBody = `Dear All

Please see the attached agenda for the online Surgical DRC meeting on ${meetingDateLong}. The meeting link will be sent in a separate email.

The committee will meet at 13:45. The presentation of the protocols will start at 14:00. Please send a representative to present the summary of your protocol if you are unable to attend. Unrepresented protocols without an apology will be rolled over to the next meeting${nextMeetingMonth ? ` in ${nextMeetingMonth}` : ''}.

The DRC meeting is an open forum to assist researchers with protocol design. We look forward to discussing your protocols with you on ${meetingDayOfWeek}.

Please note that protocols that have been fast-tracked are on the agenda for administrative purposes and do not require representation at the meeting.

Regards
${chairFirstLast}`

  const { error } = await sendEmail({
    to: toEmails,
    cc: ccEmails.length > 0 ? ccEmails : undefined,
    subject: `DRC Meeting Agenda – ${meetingDateFormatted}`,
    text: emailBody,
    attachments: [
      {
        filename: `DRC Protocol Review Agenda ${meetingDateFormatted}.pdf`,
        content: pdfBuffer,
      },
    ],
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

  return NextResponse.json({ success: true, sent: allRecipients.length, skipped })
}
