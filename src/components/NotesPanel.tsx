'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function formatStamp(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function NotesPanel({
  protocolId,
  currentNotes,
  updatedAt,
}: {
  protocolId: string
  currentNotes: string | null
  updatedAt: string | null
}) {
  const [notes, setNotes] = useState(currentNotes ?? '')
  const [savedNotes, setSavedNotes] = useState(currentNotes ?? '')
  const [stamp, setStamp] = useState(updatedAt)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const dirty = notes !== savedNotes

  async function handleSave() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const now = new Date().toISOString()
    const trimmed = notes.trim()

    const { error: updateErr } = await supabase
      .from('protocols')
      .update({ notes: trimmed || null, notes_updated_at: now })
      .eq('id', protocolId)

    if (updateErr) {
      setError(updateErr.message)
      setSaving(false)
      return
    }

    setNotes(trimmed)
    setSavedNotes(trimmed)
    setStamp(now)
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
        {stamp && !dirty && (
          <span className="text-xs text-gray-400">Last edited {formatStamp(stamp)}</span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Internal record — e.g. calls or emails with the researcher. Not shown to the
        applicant and not included in letters or the agenda.
      </p>
      <div className="space-y-4">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          placeholder="e.g. 12 Mar — phoned Dr Ndlovu about the consent form wording; revised copy to follow."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-60"
        >
          {saving ? 'Saving…' : dirty ? 'Save Notes' : 'Saved'}
        </button>
      </div>
    </div>
  )
}
