import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ReviewForm from '@/components/ReviewForm'

export default async function ReviewerProtocolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assignment } = await supabase
    .from('protocol_assignments')
    .select('id')
    .eq('protocol_id', id)
    .eq('reviewer_id', user.id)
    .single()

  if (!assignment) notFound()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('*')
    .eq('id', id)
    .single()

  if (!protocol) notFound()

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('*')
    .eq('protocol_id', id)
    .eq('reviewer_id', user.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{protocol.title || 'Untitled Protocol'}</h1>
          <p className="text-sm text-gray-500 mt-1">{protocol.serial_text}</p>
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
            <dt className="font-medium text-gray-500">Submitted</dt>
            <dd className="text-gray-900">{protocol.submitted_at ? new Date(protocol.submitted_at).toLocaleDateString() : '—'}</dd>
          </div>
          {protocol.supervisor && (
            <div className="col-span-2">
              <dt className="font-medium text-gray-500">Supervisor</dt>
              <dd className="text-gray-900">{protocol.supervisor}</dd>
            </div>
          )}
          {protocol.protocol_file && (
            <div className="col-span-2">
              <dt className="font-medium text-gray-500">Protocol File</dt>
              <dd className="text-gray-900">{protocol.protocol_file}</dd>
            </div>
          )}
        </dl>
      </div>

      <ReviewForm
        protocolId={id}
        reviewerId={user.id}
        existingReview={existingReview}
      />
    </div>
  )
}
