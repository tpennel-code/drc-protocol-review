'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ReviewRecommendation, Review } from '@/lib/types'
import { declineAssignment } from '@/lib/assignmentActions'

const recommendations: { value: ReviewRecommendation; label: string }[] = [
  { value: 'approved', label: 'Approved' },
  { value: 'minor_amendment', label: 'Minor Amendment' },
  { value: 'major_amendment', label: 'Major Amendment' },
  { value: 'rejected', label: 'Rejected' },
]

async function uploadAttachment(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', 'reviews')
  const res = await fetch('/api/upload-protocol-file', { method: 'POST', body: formData })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Upload failed')
  return json.path as string
}

export default function ReviewForm({
  protocolId,
  reviewerId,
  existingReview,
  existingAttachmentUrl,
  existingAttachmentName,
  assignmentId,
  assignmentStatus,
  protocolSerial,
}: {
  protocolId: string
  reviewerId: string
  existingReview: Review | null
  existingAttachmentUrl?: string | null
  existingAttachmentName?: string
  assignmentId?: string
  assignmentStatus?: string | null
  protocolSerial?: string | null
}) {
  const router = useRouter()
  const [recommendation, setRecommendation] = useState<ReviewRecommendation | ''>(
    existingReview?.recommendation ?? ''
  )
  const [comments, setComments] = useState(existingReview?.comments ?? '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingFileName, setPendingFileName] = useState('')

  // Decline modal state
  const [declineOpen, setDeclineOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [declining, setDeclining] = useState(false)
  const [declineError, setDeclineError] = useState('')

  async function handleDecline() {
    if (!assignmentId) return
    setDeclining(true)
    setDeclineError('')
    const { error: err } = await declineAssignment(assignmentId, declineReason.trim())
    setDeclining(false)
    if (err) {
      setDeclineError(err)
      return
    }
    setDeclineOpen(false)
    setDeclineReason('')
    router.push('/dashboard/reviewer')
    router.refresh()
  }

  const isSubmitted = !!existingReview
  const hasExistingAttachment = !!existingReview?.attachment_path

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!recommendation) return
    setSaving(true)
    setError('')
    const supabase = createClient()

    try {
      // Upload new attachment first (if any) so we can persist the path with the review
      const newFile = fileRef.current?.files?.[0]
      let attachment_path: string | null | undefined = undefined // undefined = leave as-is
      if (newFile) {
        attachment_path = await uploadAttachment(newFile)
      }

      const payload: Record<string, unknown> = {
        protocol_id: protocolId,
        reviewer_id: reviewerId,
        recommendation,
        comments,
      }
      if (attachment_path !== undefined) payload.attachment_path = attachment_path

      const { error: err } = existingReview
        ? await supabase.from('reviews').update(payload).eq('id', existingReview.id)
        : await supabase.from('reviews').insert(payload)

      if (err) throw new Error(err.message)

      // protocol_assignments.status is updated by a DB trigger
      // (mark_assignment_completed_on_review) — see supabase/auto-complete-assignment.sql
      setSuccess(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {isSubmitted ? 'Your Review (submitted)' : 'Submit Your Review'}
      </h2>
      {success && (
        <div className="mb-4 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">
          Review saved successfully.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recommendation</label>
          <select
            required
            value={recommendation}
            onChange={e => setRecommendation(e.target.value as ReviewRecommendation)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a recommendation…</option>
            {recommendations.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            rows={6}
            placeholder="Enter your review comments here…"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachment <span className="font-normal text-gray-400">(optional — annotated protocol or supporting doc)</span>
          </label>
          {hasExistingAttachment && (
            <div className="mb-2 text-sm flex items-center gap-2">
              <span className="text-gray-500">Current:</span>
              {existingAttachmentUrl ? (
                <a
                  href={existingAttachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {existingAttachmentName || 'Download'}
                </a>
              ) : (
                <span className="text-gray-700 truncate">{existingAttachmentName}</span>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            onChange={e => setPendingFileName(e.target.files?.[0]?.name ?? '')}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {pendingFileName && (
            <p className="mt-2 text-xs text-gray-500">
              {hasExistingAttachment ? 'Will replace current with: ' : 'Will upload: '}
              <span className="font-medium text-gray-700">{pendingFileName}</span>
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="submit"
            disabled={saving || !recommendation}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-60"
          >
            {saving ? 'Saving…' : isSubmitted ? 'Update Review' : 'Submit Review'}
          </button>
          {assignmentId && !isSubmitted && assignmentStatus !== 'declined' && (
            <button
              type="button"
              onClick={() => { setDeclineReason(''); setDeclineError(''); setDeclineOpen(true) }}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-white border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-5 py-2.5 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Decline to review
            </button>
          )}
          {assignmentStatus === 'declined' && (
            <span className="text-sm font-medium text-red-600">You declined this protocol.</span>
          )}
        </div>
      </form>

      {declineOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Decline to Review?</h2>
            <p className="text-sm text-gray-500 mb-4">
              You are about to decline the review of <strong>{protocolSerial ?? 'this protocol'}</strong>. The Chair will be notified by email and can assign another reviewer.
            </p>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason (optional)</label>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              rows={3}
              placeholder="e.g. Conflict of interest, on leave during meeting…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            {declineError && <p className="text-sm text-red-600 mb-2">{declineError}</p>}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setDeclineOpen(false); setDeclineReason(''); setDeclineError('') }}
                disabled={declining}
                className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecline}
                disabled={declining}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-60"
              >
                {declining ? 'Declining…' : 'Decline & notify Chair'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
