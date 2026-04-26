'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ReviewRecommendation, Review } from '@/lib/types'

const recommendations: { value: ReviewRecommendation; label: string }[] = [
  { value: 'approved', label: 'Approved' },
  { value: 'minor_amendment', label: 'Minor Amendment' },
  { value: 'major_amendment', label: 'Major Amendment' },
  { value: 'rejected', label: 'Rejected' },
]

export default function ReviewForm({
  protocolId,
  reviewerId,
  existingReview,
}: {
  protocolId: string
  reviewerId: string
  existingReview: Review | null
}) {
  const router = useRouter()
  const [recommendation, setRecommendation] = useState<ReviewRecommendation | ''>(
    existingReview?.recommendation ?? ''
  )
  const [comments, setComments] = useState(existingReview?.comments ?? '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const isSubmitted = !!existingReview

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!recommendation) return
    setSaving(true)
    setError('')
    const supabase = createClient()

    const payload = {
      protocol_id: protocolId,
      reviewer_id: reviewerId,
      recommendation,
      comments,
    }

    const { error: err } = existingReview
      ? await supabase.from('reviews').update(payload).eq('id', existingReview.id)
      : await supabase.from('reviews').insert(payload)

    if (err) {
      setError(err.message)
    } else {
      await supabase
        .from('protocol_assignments')
        .update({ status: 'completed' })
        .eq('protocol_id', protocolId)
        .eq('reviewer_id', reviewerId)
      setSuccess(true)
      router.refresh()
    }
    setSaving(false)
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving || !recommendation}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-60"
        >
          {saving ? 'Saving…' : isSubmitted ? 'Update Review' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}
