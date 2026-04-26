import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AssignReviewerPanel from '@/components/AssignReviewerPanel'
import OutcomePanel from '@/components/OutcomePanel'

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

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles(*)')
    .eq('protocol_id', id)

  const { data: reviewers } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['reviewer', 'executive', 'admin'])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{protocol.title || 'Untitled Protocol'}</h1>
        <p className="text-sm text-gray-500 mb-6">{protocol.serial_text}</p>

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
            <dt className="font-medium text-gray-500">Fast Tracked</dt>
            <dd className="text-gray-900">{protocol.fast_tracked ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Meeting Date</dt>
            <dd className="text-gray-900">{protocol.meeting_date ?? '—'}</dd>
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

      <AssignReviewerPanel
        protocolId={id}
        assignments={assignments ?? []}
        allReviewers={reviewers ?? []}
        executiveId={user.id}
      />

      {reviews && reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviewer Submissions</h2>
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-800">
                    {review.reviewer?.firstname} {review.reviewer?.surname}
                  </p>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 capitalize">
                    {review.recommendation?.replace('_', ' ')}
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
