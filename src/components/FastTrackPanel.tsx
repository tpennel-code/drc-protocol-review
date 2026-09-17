'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FastTrackDecision, OutcomeStatus } from '@/lib/types'

export default function FastTrackPanel({
  protocolId,
  decision,
  requested,
  outcome,
}: {
  protocolId: string
  decision: FastTrackDecision | null
  // Whether the applicant asked for fast track on the submission form. When
  // false the committee can still move the protocol across itself.
  requested: boolean
  outcome: OutcomeStatus
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function save(update: Record<string, unknown>) {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('protocols').update(update).eq('id', protocolId)
    setSaving(false)
    setConfirming(false)
    router.refresh()
  }

  // Accepting fast-tracks the protocol straight to approval (no full
  // review). Rejecting only records the decision — the protocol then goes
  // through the normal review process and gets its own final_outcome.
  function decide(next: FastTrackDecision) {
    return save(
      next === 'accepted'
        ? { fast_track_decision: 'accepted', final_outcome: 'approved', approval_date: new Date().toISOString() }
        : { fast_track_decision: 'rejected' },
    )
  }

  // Undoing a committee move clears the decision only. The recorded outcome is
  // left as it stands rather than silently un-approving a protocol; the
  // Outcome panel further down the page is where that gets changed.
  function undoMove() {
    return save({ fast_track_decision: null })
  }

  // Decision already made — show status only
  if (decision) {
    const accepted = decision === 'accepted'
    const moved = accepted && !requested
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
              ? moved
                ? 'Moved to Fast Track by the committee — Approved without full review'
                : 'Fast Tracked — Approved without full review'
              : 'Fast Track Rejected — Sent for full review'}
          </p>
          {moved && (
            <p className="text-xs text-green-700 mt-0.5">
              Submitted for full review. Now listed under Fast Track on the agenda.
            </p>
          )}
          {!accepted && (
            <p className="text-xs text-amber-600 mt-0.5">Assign reviewers below to proceed.</p>
          )}
        </div>
        {moved ? (
          <button
            onClick={undoMove}
            disabled={saving}
            title="Removes it from the fast-track agenda. The recorded outcome is not changed."
            className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline transition"
          >
            Undo — back to full review
          </button>
        ) : (
          <button
            onClick={() => decide(accepted ? 'rejected' : 'accepted')}
            disabled={saving}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline transition"
          >
            Change decision
          </button>
        )}
      </div>
    )
  }

  // Submitted for full review, no committee decision yet — offer the move.
  // Deliberately quiet: this panel now sits on every undecided protocol.
  if (!requested) {
    // Only offered while the outcome is still open. Moving a protocol across
    // approves it as of today, which is not something to do to a decision the
    // committee has already recorded — including the historical imports.
    if (outcome !== 'pending') return null
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Submitted for Full Review</p>
            <p className="text-sm text-gray-500 mt-0.5">
              The applicant did not request fast track. The committee can still move it across —
              it is then approved without full review and listed under Fast Track on the agenda.
            </p>
          </div>
          {confirming ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => decide('accepted')}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition disabled:opacity-60"
              >
                ⚡ Confirm — Approve now
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={saving}
                className="text-sm text-gray-500 hover:text-gray-700 px-2 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="shrink-0 text-sm font-medium text-gray-700 border border-gray-300 bg-white px-4 py-2 rounded-lg hover:border-gray-400 transition"
            >
              ⚡ Move to Fast Track
            </button>
          )}
        </div>
      </div>
    )
  }

  // Awaiting decision on the applicant's own request
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
