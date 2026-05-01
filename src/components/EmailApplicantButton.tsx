'use client'

import { useState } from 'react'

export default function EmailApplicantButton({
  protocolId,
  letterType,
  label,
}: {
  protocolId: string
  letterType: 'approved' | 'minor_amendment' | 'major_amendment' | 'fast_track_rejected'
  label?: string
}) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    setSending(true)
    setError('')
    const res = await fetch('/api/send-approval-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocolId, letterType }),
    })
    if (res.ok) {
      setSent(true)
    } else {
      const json = await res.json()
      setError(json.error ?? 'Failed to send email.')
    }
    setSending(false)
  }

  if (sent) {
    return <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-100 text-green-700">Email Sent</span>
  }

  return (
    <span className="flex items-center gap-2">
      <button
        onClick={handleSend}
        disabled={sending}
        className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
      >
        {sending ? 'Sending…' : (label ?? 'Email Applicant')}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  )
}
