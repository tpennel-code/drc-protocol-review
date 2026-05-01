import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PrintButton from './PrintButton'
import EmailApplicantButton from '@/components/EmailApplicantButton'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('protocols').select('applicant_surname, serial_text').eq('id', id).single()
  const parts = [data?.applicant_surname, data?.serial_text, 'Approved'].filter(Boolean)
  return { title: { absolute: parts.join(' ') } }
}

export default async function ApprovalLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  const [{ data: protocol }, { data: chair }] = await Promise.all([
    supabase.from('protocols').select('*').eq('id', id).single(),
    supabase.from('profiles')
      .select('professional_title, firstname, surname, email, signature_url')
      .eq('portfolio', 'Chairperson')
      .single(),
  ])

  if (!protocol) notFound()
  if (protocol.final_outcome !== 'approved') redirect(`/dashboard/executive/protocols/${id}`)

  // <<ApprovalDate>>
  const approvalDate = protocol.approval_date
    ? new Date(protocol.approval_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

  // <<Title Initial Surname>> e.g. "Ms K Manning"
  const firstInitial = protocol.applicant_firstname?.charAt(0) ?? ''
  const addresseeLine = [
    protocol.applicant_title,
    firstInitial ? `${firstInitial} ${protocol.applicant_surname}` : protocol.applicant_surname,
  ].filter(Boolean).join(' ')

  // <<Title Surname>> e.g. "Ms Manning"
  const salutation = [protocol.applicant_title, protocol.applicant_surname].filter(Boolean).join(' ')

  const chairName = chair
    ? [chair.professional_title, chair.firstname, chair.surname].filter(Boolean).join(' ')
    : 'Dr Claire Warden'

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0 !important; padding: 0 !important; }

          .letter-page {
            display: flex !important;
            flex-direction: column !important;
            box-sizing: border-box !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 10mm 15mm !important;
            overflow: hidden !important;
            background: white !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            max-width: none !important;
          }

          .letter-header {
            padding-left: 0 !important;
            padding-right: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 10px !important;
          }
          .letter-header > div:first-child,
          .letter-header > div:last-child { width: 72px !important; height: 72px !important; }
          .letter-header img { max-height: 70px !important; max-width: 70px !important; }

          .letter-body {
            padding: 24px 0 0 !important;
            flex: 1 !important;
            min-height: 0 !important;
            overflow: hidden !important;
          }
          .letter-body .mb-8 { margin-bottom: 20px !important; }
          .letter-body .mb-6 { margin-bottom: 18px !important; }
          .letter-body .mb-4 { margin-bottom: 14px !important; }
          .letter-body .mb-10 { margin-bottom: 22px !important; }
          .letter-body .leading-7 { line-height: 1.6 !important; }
          .letter-body .leading-6 { line-height: 1.5 !important; }
          .letter-body .leading-5 { line-height: 1.4 !important; }
          .letter-body .space-y-5 > * + * { margin-top: 12px !important; }
          .letter-body img { height: 70px !important; margin-bottom: 4px !important; }

          .letter-footer {
            padding-left: 0 !important;
            padding-right: 0 !important;
            padding-top: 6px !important;
            padding-bottom: 6px !important;
          }
        }
        @page { size: A4; margin: 0; }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print max-w-4xl mx-auto mt-6 mb-4 flex items-center justify-between gap-4 px-4">
        <a href={`/dashboard/executive/protocols/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Protocol
        </a>
        <div className="flex items-center gap-3">
          <EmailApplicantButton protocolId={id} letterType="approved" />
          <PrintButton />
        </div>
      </div>

      {/* Letter page */}
      <div
        className="letter-page max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl overflow-hidden print:border-0 print:rounded-none print:max-w-none print:shadow-none"
        data-pdf-title={[protocol.applicant_surname, protocol.serial_text?.replace('/', '-'), 'Approved'].filter(Boolean).join(' ')}
      >

        {/* UCT Header — logos + title */}
        <div className="letter-header flex items-center justify-between px-10 py-6 border-b-2 border-gray-800">
          <div className="w-20 h-20 flex items-center justify-center">
            {/* Place uct-shield.png in /public to show logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/uct-shield.png" alt="UCT" className="max-h-20 max-w-20 object-contain" />
          </div>
          <div className="text-center flex-1 px-4">
            <h1 className="text-3xl font-black tracking-wide text-gray-900 uppercase">University of Cape Town</h1>
          </div>
          <div className="w-20 h-20 flex items-center justify-center">
            {/* Place drc-logo.png in /public to show logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/drc-logo.png" alt="DRC" className="max-h-20 max-w-20 object-contain" />
          </div>
        </div>

        <div className="letter-body px-10 pt-8 pb-12">

          {/* Chair address block — right aligned */}
          <div className="text-right mb-8 text-sm leading-5">
            <p className="font-bold text-gray-900">Department of Surgery</p>
            <p className="text-gray-700">Departmental Research Committee</p>
            <p className="font-semibold text-blue-700">{chairName}</p>
            <p className="text-gray-700">Groote Schuur Hospital</p>
            <p className="text-gray-700">Observatory 7925</p>
            <p className="text-gray-700">South Africa</p>
            <p className="text-gray-700"><span className="font-semibold">Tel</span> (021) 404 5108</p>
            <p className="text-gray-700">
              <span className="font-semibold">Email</span>:{chair?.email ?? 'claire.warden@uct.ac.za'}
            </p>
          </div>

          {/* <<ApprovalDate>> */}
          <p className="text-sm mb-8">{approvalDate}</p>

          {/* <<Title Initial Surname>> + address */}
          <div className="mb-8 text-sm leading-6">
            <p>{addresseeLine}</p>
            <p>Department of Surgery</p>
            <p>University of Cape Town</p>
          </div>

          {/* Dear <<Title Surname>> */}
          <p className="text-sm mb-4">Dear {salutation}</p>

          {/* RE: Project <<Serial Text>> */}
          <p className="text-sm mb-4">RE: Project {protocol.serial_text ?? protocol.protocol_number ?? ''}</p>

          {/* PROJECT TITLE: <<Approved Title>> */}
          <p className="text-sm font-bold mb-6">
            PROJECT TITLE: {protocol.approved_title || protocol.title || 'Untitled Protocol'}
          </p>

          {/* Body */}
          <div className="text-sm leading-7 space-y-5 mb-10">
            <p>
              The above protocol has been reviewed by the Department of Surgery Research Committee. I am
              pleased to inform you that the committee approved the scientific merit of the study, and endorse the
              protocol for submission to the relevant ethics committee.
            </p>
            <p>
              Although this letter serves as confirmation that the above protocol has successfully passed through
              the surgical DRC, respective ethics committees still require DRC chair signature before submission.
            </p>
            <p>
              Please use the above project number in all future correspondence,
            </p>
          </div>

          <p className="text-sm mb-6">Yours sincerely</p>

          {/* Signature image */}
          {chair?.signature_url
            ? <img src={chair.signature_url} alt="Signature" className="h-24 object-contain mb-1" />
            : <div className="h-20" />
          }

          {/* Printed name */}
          <div className="text-sm">
            <p className="font-bold uppercase tracking-wide">{chairName.toUpperCase()}</p>
            <p className="uppercase tracking-wide text-gray-700">CHAIR: SURGICAL DRC</p>
          </div>
        </div>

        {/* Mission footer */}
        <div className="letter-footer border-t border-gray-200 px-10 py-4">
          <p className="text-xs text-gray-400 italic text-center">
            &ldquo;OUR MISSION is to be an outstanding teaching and research university, educating for life and addressing the challenges facing our society.&rdquo;
          </p>
        </div>
      </div>
    </>
  )
}
