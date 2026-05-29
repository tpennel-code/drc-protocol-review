'use client'

import { useState } from 'react'

const TABS = ['Protocols', 'Meeting Dates'] as const
type Tab = typeof TABS[number]

function SendRemindersButton() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [detail, setDetail] = useState('')
  const [showInfo, setShowInfo] = useState(false)

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
    <div className="flex flex-col items-end gap-1.5">
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowInfo(v => !v)}
          aria-label="What does this do?"
          aria-expanded={showInfo}
          className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition text-xs font-semibold"
        >
          i
        </button>
        {showInfo && (
          <>
            {/* click-away backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setShowInfo(false)} />
            <div className="absolute right-0 mt-2 w-80 z-20 rounded-xl border border-gray-200 bg-white p-4 shadow-lg text-left">
              <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Send Review Reminders</h4>
              <p className="text-xs text-gray-600 mb-2">
                Emails an automatic reminder to every reviewer who still has a review
                outstanding for an upcoming meeting.
              </p>
              <p className="text-xs font-medium text-gray-700 mb-1">A reviewer is reminded when:</p>
              <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                <li>they&apos;re assigned to a protocol but haven&apos;t submitted their review yet, and</li>
                <li>that protocol&apos;s meeting date is today or later (past meetings are skipped).</li>
              </ul>
              <p className="text-xs text-gray-600 mt-2">
                It covers all upcoming meetings, sends one email per outstanding protocol,
                and is signed by the Chairperson. Reviewers without a real email address
                (placeholder accounts) are skipped.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {detail && (
          <span className={`text-sm ${state === 'error' ? 'text-red-600' : 'text-green-600'}`}>{detail}</span>
        )}
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
      </div>
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
