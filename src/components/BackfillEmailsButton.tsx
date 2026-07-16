'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Summary = { scanned: number; linked: number; alreadyLogged: number; ambiguous: number; unmatched: number; notOutcome: number }

// Admin action: reconcile outcome emails Resend already sent into email_logs,
// so protocols emailed before send-logging existed pick up their "sent" pill.
export default function BackfillEmailsButton() {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Summary | null>(null)
  const [error, setError] = useState('')

  async function handleClick() {
    setRunning(true)
    setError('')
    setResult(null)
    const res = await fetch('/api/backfill-email-logs', { method: 'POST' })
    if (res.ok) {
      setResult(await res.json())
      router.refresh() // pull in the newly-linked pills
    } else {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Backfill failed.')
    }
    setRunning(false)
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-xs text-gray-500">
          Linked {result.linked} · already logged {result.alreadyLogged}
          {result.ambiguous > 0 && ` · ${result.ambiguous} ambiguous`}
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={handleClick}
        disabled={running}
        title="Match past outcome emails from Resend to protocols (recent history only)"
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 transition disabled:opacity-60"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        {running ? 'Reconciling…' : 'Reconcile sent emails'}
      </button>
    </div>
  )
}
