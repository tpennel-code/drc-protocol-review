'use client'

import { useState } from 'react'
import { emailPill } from '@/lib/email-pill'
import type { DeliveryStatus } from '@/lib/types'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

// Detail-page counterpart to the list pill: shows the outcome email's send +
// delivery state and lets the chair re-check delivery with Resend on demand.
export default function EmailStatusPill({
  protocolId,
  recipient,
  sentAt,
  status: initialStatus,
  checkedAt: initialCheckedAt,
}: {
  protocolId: string
  recipient: string
  sentAt: string
  status: DeliveryStatus | null
  checkedAt: string | null
}) {
  const [status, setStatus] = useState<DeliveryStatus | null>(initialStatus)
  const [checkedAt, setCheckedAt] = useState<string | null>(initialCheckedAt)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const pill = emailPill(status)

  async function handleVerify() {
    setVerifying(true)
    setError('')
    const res = await fetch('/api/email-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocolId }),
    })
    if (res.ok) {
      const json = await res.json()
      setStatus(json.status as DeliveryStatus)
      setCheckedAt(json.checkedAt as string)
    } else {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Verification failed.')
    }
    setVerifying(false)
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span
        title={`Sent to ${recipient} on ${fmtDate(sentAt)}`}
        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${pill.className}`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        {pill.label}
      </span>
      <button
        onClick={handleVerify}
        disabled={verifying}
        className="text-xs font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2 disabled:opacity-60"
      >
        {verifying ? 'Checking…' : 'Verify delivery'}
      </button>
      {checkedAt && !error && <span className="text-xs text-gray-400">verified {fmtDate(checkedAt)}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  )
}
