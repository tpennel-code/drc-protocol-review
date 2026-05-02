'use client'

import { useState } from 'react'

const TABS = ['Protocols', 'Meeting Dates'] as const
type Tab = typeof TABS[number]

function SendRemindersButton() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [detail, setDetail] = useState('')

  async function handleSend() {
    setState('sending')
    const res = await fetch('/api/send-reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const json = await res.json()
    if (!res.ok) {
      setDetail(json.error ?? 'Unknown error')
      setState('error')
    } else {
      setDetail(`${json.sent} reminder${json.sent !== 1 ? 's' : ''} sent`)
      setState('done')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSend}
        disabled={state === 'sending' || state === 'done'}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-300 bg-white px-3 py-1.5 rounded-lg hover:border-gray-400 transition disabled:opacity-60"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {state === 'sending' ? 'Sending…' : state === 'done' ? 'Sent ✓' : 'Send Review Reminders'}
      </button>
      {detail && (
        <span className={`text-sm ${state === 'error' ? 'text-red-600' : 'text-green-600'}`}>{detail}</span>
      )}
    </div>
  )
}

export default function ExecutiveDashboardTabs({
  protocolsContent,
  meetingDatesContent,
}: {
  protocolsContent: React.ReactNode
  meetingDatesContent: React.ReactNode
}) {
  const [active, setActive] = useState<Tab>('Protocols')

  return (
    <div>
      <div className="flex items-center justify-between border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                active === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {active === 'Protocols' && <div className="pb-1"><SendRemindersButton /></div>}
      </div>
      {active === 'Protocols' ? protocolsContent : meetingDatesContent}
    </div>
  )
}
