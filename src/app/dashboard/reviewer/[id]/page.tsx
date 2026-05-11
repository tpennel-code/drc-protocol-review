import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ReviewForm from '@/components/ReviewForm'
import DeclineProtocolButton from '@/components/DeclineProtocolButton'
import { resolveStorageLink, storageDisplayName } from '@/lib/storage'

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

  // Resolve download links for submitted documents
  const docs = await Promise.all(
    [
      { label: 'Protocol Document', value: protocol.protocol_file },
      { label: 'Data Sheet', value: protocol.datasheet_file },
      { label: 'Supplementary File', value: protocol.supplementary_file },
      { label: 'Checklist', value: protocol.checklist },
    ].map(async d => ({
      label: d.label,
      url: await resolveStorageLink(supabase, d.value),
      name: storageDisplayName(d.value),
    }))
  )
  const visibleDocs = docs.filter(d => d.url)

  // Resolve existing reviewer attachment, if any
  const existingAttachmentUrl = await resolveStorageLink(supabase, existingReview?.attachment_path)
  const existingAttachmentName = storageDisplayName(existingReview?.attachment_path)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{protocol.title || 'Untitled Protocol'}</h1>
            <p className="text-sm text-gray-500 mt-1">{protocol.serial_text}</p>
          </div>
          {!existingReview && (
            <DeclineProtocolButton assignmentId={assignment.id} protocolSerial={protocol.serial_text} />
          )}
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
        </dl>
      </div>

      {visibleDocs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitted Documents</h2>
          <ul className="space-y-3">
            {visibleDocs.map(({ label, url, name }) => (
              <li key={label} className="flex items-center gap-3 text-sm">
                <span className="text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="w-40 shrink-0 font-medium text-gray-500">{label}</span>
                <a
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ReviewForm
        protocolId={id}
        reviewerId={user.id}
        existingReview={existingReview}
        existingAttachmentUrl={existingAttachmentUrl}
        existingAttachmentName={existingAttachmentName}
      />
    </div>
  )
}
