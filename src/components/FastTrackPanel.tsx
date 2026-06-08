'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FastTrackDecision } from '@/lib/types'

export default function FastTrackPanel({
  protocolId,
  decision,
}: {
  protocolId: string
  decision: FastTrackDecision | null
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function decide(next: FastTrackDecision) {
    setSaving(true)
    const supabase = createClient()
    // Accepting fast-tracks the protocol straight to approval (no full
    // review). Rejecting only records the decision — the protocol then goes
    // through the normal review process and gets its own final_outcome.
    const update =
      next === 'accepted'
        ? { fast_track_decision: 'accepted', final_outcome: 'approved', approval_date: new Date().toISOString() }
        : { fast_track_decision: 'rejected' }
    await supabase.from('protocols').update(update).eq('id', protocolId)
    setSaving(false)
    router.refresh()
  }

  // Decision already made — show status only
  if (decision) {
    const accepted = decision === 'accepted'
    return (
      <div className={`rounded-2xl border p-6 flex items-center gap-3 ${
        accepted ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <span className={`text-lg ${accepted ? 'text-green-600' : 'text-amber-600'}`}>
          {accepted ? '⚡' : '↩'}
        </span>
        <div>
          <p className={`text-sm font-semibold ${accepted ? 'text-green-800' : 'text-amber-800'}`}>
            {accepted
              ? 'Fast Tracked — Approved without full review'
              : 'Fast Track Rejected — Sent for full review'}
          </p>
          {!accepted && (
            <p className="text-xs text-amber-600 mt-0.5">Assign reviewers below to proceed.</p>
          )}
        </div>
        <button
          onClick={() => decide(accepted ? 'rejected' : 'accepted')}
          disabled={saving}
          className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline transition"
        >
          Change decision
        </button>
      </div>
    )
  }

  // Awaiting decision
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="text-2xl">⚡</span>
        <div>
          <p className="font-semibold text-blue-900">Fast Track Requested</p>
          <p className="text-sm text-blue-700 mt-0.5">
            The applicant has requested fast track review. Only retrospective folder reviews
            and registry analyses qualify. Please make a decision below.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => decide('accepted')}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-60"
        >
          ✓ Accept — Fast Track (no review)
        </button>
        <button
          onClick={() => decide('rejected')}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-60"
        >
          ✗ Reject — Send for Full Review
        </button>
      </div>
    </div>
  )
}
