'use client'

import { useState } from 'react'

export default function SendAgendaButton({ date, apologyIds }: { date: string; apologyIds: string[] }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [detail, setDetail] = useState('')
  const [skipped, setSkipped] = useState<string[]>([])

  async function handleSend() {
    setState('sending')
    setSkipped([])
    const res = await fetch('/api/send-agenda-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, apologyIds }),
    })
    const json = await res.json()
    if (!res.ok) {
      setDetail(json.error ?? 'Unknown error')
      setState('error')
    } else {
      setDetail(`Sent to ${json.sent} recipient${json.sent !== 1 ? 's' : ''}`)
      setSkipped(json.skipped ?? [])
      setState('done')
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={handleSend}
          disabled={state === 'sending' || state === 'done'}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
        >
          {state === 'sending' ? 'Sending…' : state === 'done' ? 'Sent ✓' : 'Send Agenda'}
        </button>
        {detail && (
          <span className={`text-sm ${state === 'error' ? 'text-red-600' : 'text-green-600'}`}>{detail}</span>
        )}
      </div>
      {skipped.length > 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 max-w-md">
          <div className="font-semibold mb-1">
            {skipped.length} {skipped.length === 1 ? 'person was' : 'people were'} not emailed
            <span className="font-normal"> (placeholder or missing email):</span>
          </div>
          <div>{skipped.join(', ')}</div>
          <div className="mt-1 text-amber-600">Update their profiles with real email addresses to include them in future sends.</div>
        </div>
      )}
    </div>
  )
}
