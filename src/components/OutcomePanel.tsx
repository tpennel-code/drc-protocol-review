'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OutcomeStatus } from '@/lib/types'

const standardOutcomes: { value: OutcomeStatus; label: string }[] = [
  { value: 'approved', label: 'Approved' },
  { value: 'minor_amendment', label: 'Minor Amendment' },
  { value: 'major_amendment', label: 'Major Amendment' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'rolled_over', label: 'Rolled Over' },
  { value: 'Unclassified', label: 'Unclassified' },
  { value: 'na', label: 'N/A' },
]

const fastTrackOutcomes: { value: OutcomeStatus; label: string }[] = [
  { value: 'fast_track_accepted', label: 'Fast Track Accepted' },
  { value: 'fast_track_rejected', label: 'Fast Track Rejected' },
]

export default function OutcomePanel({
  protocolId,
  currentOutcome,
  fastTracked,
}: {
  protocolId: string
  currentOutcome: OutcomeStatus
  fastTracked: boolean | null
}) {
  const [outcome, setOutcome] = useState<OutcomeStatus>(currentOutcome ?? 'pending')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')
    const supabase = createClient()

    const setsApprovalDate = outcome === 'approved' || outcome === 'fast_track_accepted'

    const { error: updateErr } = await supabase
      .from('protocols')
      .update({ final_outcome: outcome, approval_date: setsApprovalDate ? new Date().toISOString() : null })
      .eq('id', protocolId)

    if (updateErr) {
      setError(updateErr.message)
      setSaving(false)
      return
    }

    setSuccess('Outcome saved.')
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Final Outcome</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
          <select
            value={outcome}
            onChange={e => setOutcome(e.target.value as OutcomeStatus)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            {fastTracked && (
              <optgroup label="Fast Track Decision">
                {fastTrackOutcomes.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </optgroup>
            )}
            <optgroup label={fastTracked ? 'Full Review' : undefined}>
              {standardOutcomes.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          </select>
          {outcome === 'fast_track_rejected' && (
            <p className="text-xs text-orange-600 mt-1">Protocol will proceed to full review at the next meeting.</p>
          )}
        </div>

{success && <p className="text-sm text-green-600">{success}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Outcome'}
        </button>
      </div>
    </div>
  )
}
