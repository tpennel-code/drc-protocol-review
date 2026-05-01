import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AssignReviewerPanel from '@/components/AssignReviewerPanel'
import OutcomePanel from '@/components/OutcomePanel'
import ReviewForm from '@/components/ReviewForm'
import EmailApplicantButton from '@/components/EmailApplicantButton'

export default async function ExecutiveProtocolPage({ params }: { params: Promise<{ id: string }> }) {
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
    redirect('/dashboard/reviewer')
  }

  const { data: protocol } = await supabase
    .from('protocols')
    .select('*')
    .eq('id', id)
    .single()

  if (!protocol) notFound()

  const { data: assignments } = await supabase
    .from('protocol_assignments')
    .select('*, reviewer:profiles(*)')
    .eq('protocol_id', id)
    .order('assigned_at')

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles(*)')
    .eq('protocol_id', id)

  const { data: reviewers } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['reviewer', 'executive', 'admin'])
    .eq('archived', false)
    .order('surname')

  // Ordered list for prev/next navigation
  const { data: allProtocols } = await supabase
    .from('protocols')
    .select('id, title, serial_text')
    .order('submitted_at', { ascending: false })

  const currentIndex = allProtocols?.findIndex(p => p.id === id) ?? -1
  const prevProtocol = currentIndex > 0 ? allProtocols![currentIndex - 1] : null
  const nextProtocol = currentIndex !== -1 && currentIndex < (allProtocols?.length ?? 0) - 1
    ? allProtocols![currentIndex + 1]
    : null

  // Executive's own review — only shown if they are assigned
  const isAssigned = assignments?.some(a => a.reviewer_id === user.id) ?? false

  const { data: myReview } = isAssigned
    ? await supabase.from('reviews').select('*').eq('protocol_id', id).eq('reviewer_id', user.id).single()
    : { data: null }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between text-sm">
        {prevProtocol ? (
          <a href={`/dashboard/executive/protocols/${prevProtocol.id}`}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition">
            <span>←</span>
            <span className="truncate max-w-[16rem]">{prevProtocol.serial_text ?? prevProtocol.title}</span>
          </a>
        ) : <span />}
        <a href="/dashboard/executive"
          className="text-gray-400 hover:text-gray-700 transition shrink-0 mx-4">
          All Protocols
        </a>
        {nextProtocol ? (
          <a href={`/dashboard/executive/protocols/${nextProtocol.id}`}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition text-right">
            <span className="truncate max-w-[16rem]">{nextProtocol.serial_text ?? nextProtocol.title}</span>
            <span>→</span>
          </a>
        ) : <span />}
      </div>

      {/* Protocol details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">

        {/* Row 1: status badge + action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize whitespace-nowrap ${
            protocol.final_outcome === 'approved' ? 'bg-green-100 text-green-700' :
            protocol.final_outcome === 'fast_track_accepted' ? 'bg-green-100 text-green-700' :
            protocol.final_outcome === 'rejected' ? 'bg-red-100 text-red-700' :
            protocol.final_outcome === 'fast_track_rejected' ? 'bg-orange-100 text-orange-700' :
            protocol.final_outcome === 'minor_amendment' ? 'bg-blue-100 text-blue-700' :
            protocol.final_outcome === 'major_amendment' ? 'bg-orange-100 text-orange-700' :
            protocol.final_outcome === 'Unclassified' ? 'bg-purple-100 text-purple-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {protocol.final_outcome === 'fast_track_accepted' ? 'Fast Track Accepted' :
             protocol.final_outcome === 'fast_track_rejected' ? 'Fast Track Rejected' :
             protocol.final_outcome?.replace(/_/g, ' ') ?? 'Pending'}
          </span>

          <div className="flex flex-wrap items-center gap-3">
            {(protocol.final_outcome === 'approved' || protocol.final_outcome === 'fast_track_accepted') && (
              <>
                <a href={`/dashboard/executive/protocols/${id}/approval-letter`}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition whitespace-nowrap">
                  Generate Approval Letter
                </a>
                <EmailApplicantButton protocolId={id} letterType="approved" label="Send Approval Email to Applicant" />
              </>
            )}
            {protocol.final_outcome === 'minor_amendment' && (
              <>
                <a href={`/dashboard/executive/protocols/${id}/minor-amendment-letter`}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition whitespace-nowrap">
                  Generate Amendment Letter
                </a>
                <EmailApplicantButton protocolId={id} letterType="minor_amendment" label="Send Amendment Email to Applicant" />
              </>
            )}
            {protocol.final_outcome === 'major_amendment' && (
              <>
                <a href={`/dashboard/executive/protocols/${id}/amendment-letter`}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition whitespace-nowrap">
                  Generate Amendment Letter
                </a>
                <EmailApplicantButton protocolId={id} letterType="major_amendment" label="Send Amendment Email to Applicant" />
              </>
            )}
            {protocol.fast_tracked && protocol.final_outcome === 'fast_track_rejected' && (
              <>
                <a href={`/dashboard/executive/protocols/${id}/fasttrack-rejection-letter`}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition whitespace-nowrap">
                  Fast Track Rejection Letter
                </a>
                <EmailApplicantButton protocolId={id} letterType="fast_track_rejected" label="Send Fast Track Email to Applicant" />
              </>
            )}
          </div>
        </div>

        {/* Row 2: title + serial */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{protocol.title || 'Untitled Protocol'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{protocol.serial_text}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Applicant</dt>
            <dd className="text-gray-900">{protocol.applicant_title} {protocol.applicant_firstname} {protocol.applicant_surname}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Email</dt>
            <dd className="text-gray-900">{protocol.applicant_email}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Study Type</dt>
            <dd className="text-gray-900">{protocol.study_type || '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Degree</dt>
            <dd className="text-gray-900">{protocol.degree || '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Submission Type</dt>
            <dd className="text-gray-900">{protocol.submission_type || '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Fast Track Requested</dt>
            <dd className="text-gray-900">{protocol.fast_tracked ? 'Yes' : 'No'}</dd>
          </div>
          {protocol.fast_tracked && (
            <div>
              <dt className="font-medium text-gray-500">Fast Track Outcome</dt>
              <dd className="text-gray-900">
                {protocol.final_outcome === 'fast_track_accepted' ? 'Accepted' :
                 protocol.final_outcome === 'fast_track_rejected' ? 'Rejected' :
                 '—'}
              </dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-gray-500">Date Submitted</dt>
            <dd className="text-gray-900">{protocol.submitted_at ? String(protocol.submitted_at).replace(/[T ].*/, '') : '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Meeting Date</dt>
            <dd className="text-gray-900">{protocol.meeting_date ? String(protocol.meeting_date).replace(/[T ].*/, '') : '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Supervisor</dt>
            <dd className="text-gray-900">{protocol.supervisor || '—'}</dd>
          </div>
          {protocol.if_resubmission_drc_number && (
            <div className="col-span-2">
              <dt className="font-medium text-gray-500">Previous DRC Number</dt>
              <dd className="text-gray-900">{protocol.if_resubmission_drc_number}</dd>
            </div>
          )}
          {protocol.list_amendments && (
            <div className="col-span-2">
              <dt className="font-medium text-gray-500">Amendments Listed</dt>
              <dd className="text-gray-900 whitespace-pre-wrap">{protocol.list_amendments}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Submitted documents */}
      {[
        { label: 'Protocol Document', value: protocol.protocol_file },
        { label: 'Data Sheet', value: protocol.datasheet_file },
        { label: 'Supplementary File', value: protocol.supplementary_file },
        { label: 'Checklist', value: protocol.checklist },
      ].some(f => f.value) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitted Documents</h2>
          <ul className="space-y-3">
            {[
              { label: 'Protocol Document', value: protocol.protocol_file },
              { label: 'Data Sheet', value: protocol.datasheet_file },
              { label: 'Supplementary File', value: protocol.supplementary_file },
              { label: 'Checklist', value: protocol.checklist },
            ].filter(f => f.value).map(({ label, value }) => {
              const isUrl = value!.startsWith('http://') || value!.startsWith('https://')
              const filename = isUrl
                ? decodeURIComponent(value!.split('/').pop() ?? value!)
                : value!
              return (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="w-40 shrink-0 font-medium text-gray-500">{label}</span>
                  {isUrl ? (
                    <a
                      href={value!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {filename}
                    </a>
                  ) : (
                    <span className="text-gray-700 truncate">{filename}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Assign reviewers — two dropdown slots */}
      <AssignReviewerPanel
        protocolId={id}
        assignments={assignments ?? []}
        allReviewers={reviewers ?? []}
        executiveId={user.id}
      />

      {/* Reviewer submissions — visible to executive */}
      {reviews && reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviewer Submissions</h2>
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-800">
                    {review.reviewer?.professional_title} {review.reviewer?.firstname} {review.reviewer?.surname}
                    {review.reviewer_id === user.id && (
                      <span className="ml-2 text-xs text-gray-400">(you)</span>
                    )}
                  </p>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 capitalize">
                    {review.recommendation?.replace(/_/g, ' ')}
                  </span>
                </div>
                {review.comments && (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{review.comments}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive's own review — only if assigned as a reviewer */}
      {isAssigned && (
        <ReviewForm
          protocolId={id}
          reviewerId={user.id}
          existingReview={myReview ?? null}
        />
      )}

      {/* Final outcome decision — always available to executive */}
      <OutcomePanel
        protocolId={id}
        currentOutcome={protocol.final_outcome}
        fastTracked={protocol.fast_tracked}
      />
    </div>
  )
}
