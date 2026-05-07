import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { renderAgendaPdf } from '@/lib/agenda-pdf-render'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const date = url.searchParams.get('date')
  const apologyParam = url.searchParams.get('apologies') ?? ''
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const apologyIds = apologyParam.split(',').filter(Boolean)

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
    .filter(r => apologyIds.includes(r.id))
    .map(r => [r.professional_title, r.firstname, r.surname].filter(Boolean).join(' '))

  const chairName = chair
    ? [chair.professional_title, chair.firstname, chair.surname].filter(Boolean).join(' ')
    : 'Dr Claire Warden'
  const chairEmail = chair?.email ?? 'claire.warden@uct.ac.za'
  const nextMeeting = nextMeetingRows?.[0]?.meeting_date
    ? fmtDate(String(nextMeetingRows[0].meeting_date))
    : null
  const meetingDateFormatted = fmtDate(date)

  const reviewerNames = (allReviewers ?? []).map(r =>
    [r.professional_title, r.firstname, r.surname].filter(Boolean).join(' ')
  )
  const applicantNames = (protocols ?? []).map(p =>
    [p.applicant_title, p.applicant_firstname, p.applicant_surname].filter(Boolean).join(' ')
  )
  const agendaSentTo = [...reviewerNames, ...applicantNames].join(', ')

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

  const filename = `DRC Protocol Review Agenda ${meetingDateFormatted}.pdf`

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
