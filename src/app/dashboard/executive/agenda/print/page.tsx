import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PrintButton from './PrintButton'
import SendAgendaButton from './SendAgendaButton'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export default async function AgendaPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; apologies?: string }>
}) {
  const { date, apologies: apologyParam } = await searchParams
  if (!date) redirect('/dashboard/executive/agenda')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) redirect('/dashboard/reviewer')

  const apologyIds = apologyParam ? apologyParam.split(',').filter(Boolean) : []

  const [
    { data: protocols },
    { data: allReviewers },
    { data: chair },
    { data: nextMeetingRows },
  ] = await Promise.all([
    supabase
      .from('protocols')
      .select('id, serial_text, title, applicant_title, applicant_firstname, applicant_surname, fast_tracked, final_outcome')
      .eq('omit_record', false)
      .or(`meeting_date.eq.${date},meeting_date.like.${date}%`)
      .order('fast_tracked', { ascending: false })
      .order('serial_text'),
    supabase
      .from('profiles')
      .select('id, professional_title, firstname, surname')
      .in('role', ['reviewer', 'executive', 'admin'])
      .eq('archived', false)
      .order('surname'),
    supabase
      .from('profiles')
      .select('professional_title, firstname, surname, email, signature_url')
      .eq('portfolio', 'Chairperson')
      .single(),
    supabase
      .from('meeting_dates')
      .select('meeting_date')
      .gt('meeting_date', date)
      .order('meeting_date')
      .limit(1),
  ])

  const fastTracked = (protocols ?? []).filter(p => p.fast_tracked)
  const forReview = (protocols ?? []).filter(p => !p.fast_tracked)

  const apologisedReviewers = (allReviewers ?? []).filter(r => apologyIds.includes(r.id))
  const chairName = chair
    ? [chair.professional_title, chair.firstname, chair.surname].filter(Boolean).join(' ')
    : 'Dr Claire Warden'
  const chairEmail = chair?.email ?? 'claire.warden@uct.ac.za'

  const nextMeeting = nextMeetingRows?.[0]?.meeting_date
    ? fmtDate(String(nextMeetingRows[0].meeting_date))
    : null

  const meetingDateFormatted = fmtDate(date)

  // Agenda sent to: all reviewers + all applicants
  const reviewerNames = (allReviewers ?? []).map(r =>
    [r.professional_title, r.firstname, r.surname].filter(Boolean).join(' ')
  )
  const applicantNames = (protocols ?? []).map(p =>
    [p.applicant_title, p.applicant_firstname, p.applicant_surname].filter(Boolean).join(' ')
  )
  const agendaSentTo = [...reviewerNames, ...applicantNames].join(', ')

  function protocolLabel(p: typeof protocols[0], n: string) {
    const applicant = [p.applicant_title, p.applicant_firstname?.[0] ? `${p.applicant_firstname[0]} ${p.applicant_surname}` : p.applicant_surname].filter(Boolean).join(' ')
    return `${n} ${applicant} (Protocol No.: ${p.serial_text ?? '—'})\n${p.title ?? 'Untitled Protocol'}`
  }

  let fastIdx = 1
  let reviewIdx = 1

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0 !important; padding: 0 !important; }
          .agenda-page {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 12mm 15mm !important;
            box-sizing: border-box !important;
            background: white !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            max-width: none !important;
          }
        }
        @page { size: A4; margin: 0; }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print max-w-4xl mx-auto mt-6 mb-4 flex items-center justify-between px-4">
        <a href="/dashboard/executive/agenda" className="text-sm text-gray-500 hover:text-gray-700">← Back</a>
        <div className="flex items-center gap-3">
          <SendAgendaButton date={date} apologyIds={apologyIds} />
          <PrintButton />
        </div>
      </div>

      {/* Agenda page */}
      <div className="agenda-page max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl overflow-hidden print:border-0 print:rounded-none print:max-w-none print:shadow-none mb-12">

        {/* UCT Header */}
        <div className="flex items-center justify-between px-10 py-5 border-b-2 border-gray-800">
          <img src="/uct-shield.png" alt="UCT" className="h-16 w-16 object-contain" />
          <div className="text-center flex-1 px-4">
            <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase">University of Cape Town</h1>
          </div>
          <img src="/drc-logo.png" alt="DRC" className="h-16 w-16 object-contain" />
        </div>

        <div className="px-10 pt-6 pb-10 text-sm">

          {/* Meeting info block */}
          <div className="text-center mb-6 space-y-0.5">
            <p className="font-bold text-base uppercase tracking-wide">Department of Surgery Research Committee</p>
            <p>13:30 Committee Members only</p>
            <p>13:45 Investigators</p>
            <p className="font-semibold">{meetingDateFormatted}</p>
            <p>Venue: via Zoom</p>
            <p className="text-gray-600 mt-2">
              Should you be unable to attend and wish to have your apologies recorded,<br />
              email <span className="font-medium">{chairEmail}</span>
            </p>
          </div>

          <p className="font-bold text-lg text-center mb-6 uppercase tracking-widest">Agenda</p>

          {/* 1. Apologies */}
          <div className="mb-5">
            <p className="font-semibold mb-1">1. Apologies</p>
            {apologisedReviewers.length > 0 ? (
              <p className="ml-4 text-gray-700 leading-6">
                {apologisedReviewers.map(r => [r.professional_title, r.firstname, r.surname].filter(Boolean).join(' ')).join(', ')}
              </p>
            ) : (
              <p className="ml-4 text-gray-400 italic">None recorded</p>
            )}
          </div>

          {/* 2. Minutes */}
          <div className="mb-5">
            <p className="font-semibold">2. Minutes of Previous Meeting</p>
          </div>

          {/* 3. Matters of Urgency */}
          <div className="mb-5">
            <p className="font-semibold">3. Matters of Urgency</p>
          </div>

          {/* 4. Fast-Tracked */}
          <div className="mb-5">
            <p className="font-semibold mb-2">4. Fast-Tracked Protocols</p>
            {fastTracked.length > 0 ? fastTracked.map(p => {
              const n = `4.${fastIdx++}`
              const applicant = [p.applicant_title, p.applicant_firstname?.[0] ? `${p.applicant_firstname[0].toUpperCase()} ${p.applicant_surname?.toUpperCase()}` : p.applicant_surname?.toUpperCase()].filter(Boolean).join(' ')
              return (
                <div key={p.id} className="ml-4 mb-3">
                  <p className="font-medium">{n} {applicant} (Protocol No.: {p.serial_text ?? '—'})</p>
                  <p className="text-gray-700 ml-4">{p.title ?? 'Untitled Protocol'}</p>
                </div>
              )
            }) : (
              <p className="ml-4 text-gray-400 italic">None</p>
            )}
          </div>

          {/* 5. Protocols for Review */}
          <div className="mb-6">
            <p className="font-semibold mb-2">5. Protocols For Review (14:00)</p>
            {forReview.length > 0 ? forReview.map(p => {
              const n = `5.${reviewIdx++}`
              const title = p.applicant_title ?? ''
              const initial = p.applicant_firstname?.[0] ? `${p.applicant_firstname[0]} ` : ''
              const surname = p.applicant_surname ?? ''
              const applicant = [title, `${initial}${surname}`].filter(Boolean).join(' ')
              return (
                <div key={p.id} className="ml-4 mb-3">
                  <p className="font-medium">{n} {applicant} (Protocol No.: {p.serial_text ?? '—'})</p>
                  <p className="text-gray-700 ml-4">{p.title ?? 'Untitled Protocol'}</p>
                </div>
              )
            }) : (
              <p className="ml-4 text-gray-400 italic">None</p>
            )}
          </div>

          {/* 6. Agenda Sent To */}
          <div className="mb-8">
            <p className="font-semibold mb-1">6. Agenda Sent to: <span className="font-normal text-gray-700">{agendaSentTo}</span></p>
          </div>

          {/* Next meeting */}
          {nextMeeting && (
            <p className="mb-6">Next Meeting <span className="font-semibold">{nextMeeting}</span></p>
          )}

          {/* Sign-off */}
          <p className="mb-4">Yours sincerely</p>
          {chair?.signature_url
            ? <img src={chair.signature_url} alt="Signature" className="h-20 object-contain mb-1" />
            : <div className="h-16" />
          }
          <p className="font-bold uppercase tracking-wide">{chairName.toUpperCase()}</p>
          <p className="uppercase tracking-wide text-gray-700">Chair: Surgical DRC</p>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-10 py-4">
          <p className="text-xs text-gray-400 italic text-center">
            &ldquo;OUR MISSION is to be an outstanding teaching and research university, educating for life and addressing the challenges facing our society.&rdquo;
          </p>
        </div>
      </div>
    </>
  )
}
