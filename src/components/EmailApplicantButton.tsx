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
        className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
      >
        {sending ? (
          'Sending…'
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Email Applicant
          </>
        )}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  )
}
