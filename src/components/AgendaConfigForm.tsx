'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export default function AgendaConfigForm({
  meetingDates,
  reviewers,
}: {
  meetingDates: { id: string; date: string }[]
  reviewers: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState('')
  const [apologies, setApologies] = useState<Set<string>>(new Set())

  function toggleApology(id: string) {
    setApologies(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleGenerate() {
    if (!selectedDate) return
    const params = new URLSearchParams()
    params.set('date', selectedDate)
    if (apologies.size > 0) params.set('apologies', [...apologies].join(','))
    router.push(`/dashboard/executive/agenda/print?${params.toString()}`)
  }

  return (
    <div className="space-y-8">
      {/* Meeting date */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">Meeting Date <span className="text-red-500">*</span></label>
        <select
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Select a meeting date —</option>
          {meetingDates.map(m => (
            <option key={m.id} value={m.date}>{fmtDate(m.date)}</option>
          ))}
        </select>
      </div>

      {/* Apologies */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-sm font-semibold text-gray-900 mb-1">Apologies</p>
        <p className="text-xs text-gray-500 mb-4">Select reviewers who have sent their apologies.</p>
        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {reviewers.map(r => (
            <label key={r.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded px-2 py-1.5">
              <input
                type="checkbox"
                checked={apologies.has(r.id)}
                onChange={() => toggleApology(r.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {r.name}
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!selectedDate}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
      >
        Generate Agenda
      </button>
    </div>
  )
}
