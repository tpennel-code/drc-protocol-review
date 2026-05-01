'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type DateRow = { id: string; deadline_date?: string; meeting_date?: string; notes: string | null }

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function isPast(iso: string) {
  return new Date(iso + 'T00:00:00') < new Date(new Date().toDateString())
}

function isNext(iso: string, list: DateRow[], field: 'deadline_date' | 'meeting_date') {
  const today = new Date(new Date().toDateString())
  const future = list
    .map(r => r[field]!)
    .filter(d => new Date(d + 'T00:00:00') >= today)
    .sort()
  return future[0] === iso
}

// ── Single date column ────────────────────────────────────────────────────────

function DateColumn({
  title,
  rows,
  field,
  table,
  onRefresh,
}: {
  title: string
  rows: DateRow[]
  field: 'deadline_date' | 'meeting_date'
  table: 'submission_deadlines' | 'meeting_dates'
  onRefresh: () => void
}) {
  const [adding, setAdding]   = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd() {
    if (!newDate) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from(table).insert({ [field]: newDate, notes: newNote || null })
    setNewDate('')
    setNewNote('')
    setAdding(false)
    setSaving(false)
    onRefresh()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from(table).delete().eq('id', id)
    setDeletingId(null)
    onRefresh()
  }

  async function handleNoteUpdate(id: string, note: string) {
    const supabase = createClient()
    await supabase.from(table).update({ notes: note || null }).eq('id', id)
    onRefresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex-1">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <button
          onClick={() => setAdding(v => !v)}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-lg transition"
        >
          + Add date
        </button>
      </div>

      {adding && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 space-y-3">
          <div className="flex gap-3">
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Notes (optional)"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !newDate}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-60 transition">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setAdding(false); setNewDate(''); setNewNote('') }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-gray-50">
        {rows.length === 0 && (
          <li className="px-6 py-8 text-center text-sm text-gray-400">No dates set.</li>
        )}
        {rows.map(row => {
          const dateStr = row[field]!
          const past    = isPast(dateStr)
          const next    = isNext(dateStr, rows, field)
          return (
            <li key={row.id} className={`px-6 py-3.5 flex items-start gap-3 ${past ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${past ? 'text-gray-400' : 'text-gray-900'}`}>
                    {fmtDate(dateStr)}
                  </p>
                  {next && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Next
                    </span>
                  )}
                  {past && (
                    <span className="text-xs text-gray-400">Past</span>
                  )}
                </div>
                {row.notes && (
                  <p className="text-xs text-gray-400 mt-0.5">{row.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(row.id)}
                disabled={deletingId === row.id}
                className="text-xs text-red-400 hover:text-red-600 transition shrink-0 mt-0.5"
              >
                {deletingId === row.id ? '…' : 'Remove'}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScheduleManager({
  deadlines,
  meetings,
}: {
  deadlines: DateRow[]
  meetings: DateRow[]
}) {
  const router = useRouter()

  // Pair up deadlines and meetings for the overview table
  const paired = deadlines.map((d, i) => ({
    deadline: d.deadline_date!,
    meeting:  meetings[i]?.meeting_date ?? null,
  }))

  const today     = new Date(new Date().toDateString())
  const nextDeadline = deadlines.find(d => new Date(d.deadline_date! + 'T00:00:00') >= today)
  const nextMeeting  = meetings.find(m => new Date(m.meeting_date! + 'T00:00:00') >= today)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">DRC Schedule</h1>

      {/* Next up banner */}
      {(nextDeadline || nextMeeting) && (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-4 flex items-center gap-8">
          {nextDeadline && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next submission deadline</p>
              <p className="text-base font-semibold text-orange-600 mt-0.5">{fmtDate(nextDeadline.deadline_date!)}</p>
            </div>
          )}
          {nextDeadline && nextMeeting && <div className="h-8 w-px bg-gray-100" />}
          {nextMeeting && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next meeting</p>
              <p className="text-base font-semibold text-blue-600 mt-0.5">{fmtDate(nextMeeting.meeting_date!)}</p>
            </div>
          )}
        </div>
      )}

      {/* Paired overview */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">2026 Schedule Overview</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 text-left font-medium text-gray-500">#</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Submission Deadline</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Meeting Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paired.map((row, i) => {
              const dPast = isPast(row.deadline)
              const dNext = !dPast && nextDeadline?.deadline_date === row.deadline
              return (
                <tr key={i} className={dPast ? 'opacity-40' : ''}>
                  <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-6 py-3">
                    <span className={`font-medium ${dNext ? 'text-orange-600' : 'text-gray-800'}`}>
                      {fmtDate(row.deadline)}
                    </span>
                    {dNext && <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">Next</span>}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {row.meeting ? fmtDate(row.meeting) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Manage columns side by side */}
      <div className="flex gap-6">
        <DateColumn
          title="Submission Deadlines"
          rows={deadlines}
          field="deadline_date"
          table="submission_deadlines"
          onRefresh={() => router.refresh()}
        />
        <DateColumn
          title="Meeting Dates"
          rows={meetings}
          field="meeting_date"
          table="meeting_dates"
          onRefresh={() => router.refresh()}
        />
      </div>
    </div>
  )
}
