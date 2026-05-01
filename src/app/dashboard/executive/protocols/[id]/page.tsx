import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AssignReviewerPanel from '@/components/AssignReviewerPanel'
import OutcomePanel from '@/components/OutcomePanel'
import ReviewForm from '@/components/ReviewForm'
import FastTrackPanel from '@/components/FastTrackPanel'
import MeetingDateEditor from '@/components/MeetingDateEditor'

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
    .order('surname')

  const { data: meetingDates } = await supabase
    .from('meeting_dates')
    .select('meeting_date')
    .order('meeting_date')

  const availableMeetingDates = (meetingDates ?? []).map((r: any) => r.meeting_date as string)

  const isAssigned = assignments?.some(a => a.reviewer_id === user.id) ?? false

  const { data: myReview } = isAssigned
    ? await supabase.from('reviews').select('*').eq('protocol_id', id).eq('reviewer_id', user.id).single()
    : { data: null }

  // Fast track logic
  const isFastTrack       = protocol.fast_tracked === true
  const fastTrackApproved = protocol.fast_track_approved ?? null  // null | true | false
  const fastTrackDecided  = fastTrackApproved !== null

  // Show assign-reviewers panel when: not fast track, OR fast track was rejected
  const showAssignPanel = !isFastTrack || fastTrackApproved === false

  // Executive can submit their own review when: assigned as reviewer, OR fast track approved
  const showExecReview = isAssigned || fastTrackApproved === true

  const { data: execReview } = (showExecReview && !isAssigned)
    ? await supabase.from('reviews').select('*').eq('protocol_id', id).eq('reviewer_id', user.id).maybeSingle()
    : { data: myReview }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Protocol details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{protocol.title || 'Untitled Protocol'}</h1>
              {isFastTrack && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
                  ⚡ Fast Track
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{protocol.serial_text}</p>
          </div>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full shrink-0 capitalize ${
            protocol.final_outcome === 'approved'        ? 'bg-green-100 text-green-700' :
            protocol.final_outcome === 'rejected'        ? 'bg-red-100 text-red-700' :
            protocol.final_outcome === 'minor_amendment' ? 'bg-blue-100 text-blue-700' :
            protocol.final_outcome === 'major_amendment' ? 'bg-orange-100 text-orange-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {protocol.final_outcome?.replace(/_/g, ' ') ?? 'Pending'}
          </span>
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
            <dt className="font-medium text-gray-500">Supervisor</dt>
            <dd className="text-gray-900">{protocol.supervisor || '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Meeting Date</dt>
            <dd>
              <MeetingDateEditor
                protocolId={id}
                currentDate={protocol.meeting_date ?? null}
                availableDates={availableMeetingDates}
              />
            </dd>
          </div>
          {protocol.if_resubmission_drc_number && (
            <div>
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

      {/* Fast track decision panel — only for fast-tracked protocols */}
      {isFastTrack && (
        <FastTrackPanel
          protocolId={id}
          fastTrackApproved={fastTrackApproved}
        />
      )}

      {/* Assign reviewers — hidden when fast track is approved */}
      {showAssignPanel && (
        <AssignReviewerPanel
          protocolId={id}
          assignments={assignments ?? []}
          allReviewers={reviewers ?? []}
          executiveId={user.id}
        />
      )}

      {/* Reviewer submissions */}
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

      {/* Executive review form — when assigned as reviewer, or fast track approved */}
      {showExecReview && (
        <ReviewForm
          protocolId={id}
          reviewerId={user.id}
          existingReview={execReview ?? null}
        />
      )}

      {/* Final outcome — always visible */}
      <OutcomePanel
        protocolId={id}
        currentOutcome={protocol.final_outcome}
        applicantEmail={protocol.applicant_email}
        protocolTitle={protocol.title}
        executiveId={user.id}
      />
    </div>
  )
}
