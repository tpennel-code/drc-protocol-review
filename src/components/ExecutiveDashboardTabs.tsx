'use client'

import { useState } from 'react'

const TABS = ['Protocols', 'Meeting Dates'] as const
type Tab = typeof TABS[number]

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
      <div className="flex gap-1 border-b border-gray-200 mb-6">
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
      {active === 'Protocols' ? protocolsContent : meetingDatesContent}
    </div>
  )
}
