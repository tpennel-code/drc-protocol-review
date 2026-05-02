'use client'

import { useState } from 'react'

export default function SendAgendaButton({ date, apologyIds }: { date: string; apologyIds: string[] }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [detail, setDetail] = useState('')

  async function handleSend() {
    setState('sending')
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
      setState('done')
    }
  }

  return (
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
  )
}
