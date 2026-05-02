'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export default function MeetingDatePicker({
  protocolId,
  current,
  meetingDates,
}: {
  protocolId: string
  current: string | null
  meetingDates: string[]
}) {
  const router = useRouter()
  const [value, setValue] = useState(current ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(newDate: string) {
    setValue(newDate)
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('protocols')
      .update({ meeting_date: newDate || null })
      .eq('id', protocolId)
    if (err) setError(err.message)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={e => handleChange(e.target.value)}
        disabled={saving}
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
      >
        <option value="">— Not set —</option>
        {meetingDates.map(d => (
          <option key={d} value={d}>{fmtDate(d)}</option>
        ))}
      </select>
      {saving && <span className="text-xs text-gray-400">Saving…</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
