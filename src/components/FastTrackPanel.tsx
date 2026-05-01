'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function FastTrackPanel({
  protocolId,
  fastTrackApproved,
}: {
  protocolId: string
  fastTrackApproved: boolean | null
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function decide(approved: boolean) {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('protocols')
      .update({ fast_track_approved: approved })
      .eq('id', protocolId)
    setSaving(false)
    router.refresh()
  }

  // Decision already made — show status only
  if (fastTrackApproved !== null && fastTrackApproved !== undefined) {
    return (
      <div className={`rounded-2xl border p-6 flex items-center gap-3 ${
        fastTrackApproved
          ? 'bg-green-50 border-green-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <span className={`text-lg ${fastTrackApproved ? 'text-green-600' : 'text-amber-600'}`}>
          {fastTrackApproved ? '⚡' : '↩'}
        </span>
        <div>
          <p className={`text-sm font-semibold ${fastTrackApproved ? 'text-green-800' : 'text-amber-800'}`}>
            {fastTrackApproved
              ? 'Fast Track Approved — Executive review only'
              : 'Fast Track Rejected — Sent for standard review'}
          </p>
          {!fastTrackApproved && (
            <p className="text-xs text-amber-600 mt-0.5">Assign two reviewers below to proceed.</p>
          )}
        </div>
        <button
          onClick={() => decide(!fastTrackApproved)}
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
          onClick={() => decide(true)}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-60"
        >
          ✓ Approve Fast Track
        </button>
        <button
          onClick={() => decide(false)}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-60"
        >
          ✗ Reject — Send for Standard Review
        </button>
      </div>
    </div>
  )
}
