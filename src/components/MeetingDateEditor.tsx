'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function MeetingDateEditor({
  protocolId,
  currentDate,
  availableDates,
}: {
  protocolId: string
  currentDate: string | null
  availableDates: string[]
}) {
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState(currentDate ?? '')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('protocols')
      .update({ meeting_date: selected || null })
      .eq('id', protocolId)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-900">{currentDate ? fmtDate(currentDate) : '—'}</span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-blue-600 hover:text-blue-800 transition"
        >
          Edit
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">— None —</option>
        {availableDates.map(d => (
          <option key={d} value={d}>{fmtDate(d)}</option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-60 transition"
      >
        {saving ? '…' : 'Save'}
      </button>
      <button
        onClick={() => { setEditing(false); setSelected(currentDate ?? '') }}
        className="text-xs text-gray-500 hover:text-gray-700 transition"
      >
        Cancel
      </button>
    </div>
  )
}
