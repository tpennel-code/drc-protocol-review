'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OutcomeStatus } from '@/lib/types'

const outcomes: { value: OutcomeStatus; label: string }[] = [
  { value: 'approved', label: 'Approved' },
  { value: 'minor_amendment', label: 'Minor Amendment' },
  { value: 'major_amendment', label: 'Major Amendment' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'rolled_over', label: 'Rolled Over' },
  { value: 'na', label: 'N/A' },
]

export default function OutcomePanel({
  protocolId,
  currentOutcome,
  applicantEmail,
  protocolTitle,
  executiveId,
}: {
  protocolId: string
  currentOutcome: OutcomeStatus
  applicantEmail: string | null
  protocolTitle: string | null
  executiveId: string
}) {
  const router = useRouter()
  const [outcome, setOutcome] = useState<OutcomeStatus>(currentOutcome ?? 'pending')
  const [saving, setSaving] = useState(false)
  const [sendEmail, setSendEmail] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')
    const supabase = createClient()

    const { error: updateErr } = await supabase
      .from('protocols')
      .update({ final_outcome: outcome, approval_date: outcome === 'approved' ? new Date().toISOString() : null })
      .eq('id', protocolId)

    if (updateErr) {
      setError(updateErr.message)
      setSaving(false)
      return
    }

    if (sendEmail && applicantEmail && (outcome === 'approved' || outcome === 'rejected' || outcome === 'minor_amendment' || outcome === 'major_amendment')) {
      const emailType = outcome === 'approved' ? 'approval' : outcome === 'rejected' ? 'rejection' : 'amendment'
      await supabase.from('email_logs').insert({
        protocol_id: protocolId,
        sent_by: executiveId,
        recipient_email: applicantEmail,
        email_type: emailType,
      })

      const res = await fetch('/api/send-outcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocolId, outcome, applicantEmail, protocolTitle }),
      })

      if (!res.ok) {
        setError('Outcome saved but email failed to send.')
        setSaving(false)
        router.refresh()
        return
      }
    }

    setSuccess('Outcome saved' + (sendEmail ? ' and email sent.' : '.'))
    setSaving(false)
    router.refresh()
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
            {outcomes.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {applicantEmail && outcome !== 'pending' && outcome !== 'rolled_over' && outcome !== 'na' && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={e => setSendEmail(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Send outcome email to <strong>{applicantEmail}</strong>
            </span>
          </label>
        )}

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
