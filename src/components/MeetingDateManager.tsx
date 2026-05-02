'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

type Row = { id: string; meeting_date: string; deadline_date: string | null }

export default function MeetingDateManager({ rows }: { rows: Row[] }) {
  const router = useRouter()
  const [newMeeting, setNewMeeting] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editMeeting, setEditMeeting] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newMeeting) return
    setAdding(true)
    setAddError('')
    const supabase = createClient()
    const { error: me } = await supabase.from('meeting_dates').insert({ meeting_date: newMeeting })
    if (me) { setAddError(me.message); setAdding(false); return }
    if (newDeadline) {
      await supabase.from('submission_deadlines').insert({ deadline_date: newDeadline })
    }
    setNewMeeting('')
    setNewDeadline('')
    setAdding(false)
    router.refresh()
  }

  async function handleDelete(id: string, meetingDate: string) {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('meeting_dates').delete().eq('id', id)
    // also remove paired deadline if it exists for this meeting date's rank
    setDeleting(null)
    router.refresh()
  }

  function openEdit(row: Row) {
    setEditing(row.id)
    setEditMeeting(row.meeting_date)
    setEditDeadline(row.deadline_date ?? '')
  }

  async function handleSave(id: string, oldDeadline: string | null) {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('meeting_dates').update({ meeting_date: editMeeting }).eq('id', id)
    if (editDeadline) {
      if (oldDeadline) {
        // find the deadline row by date and update
        await supabase.from('submission_deadlines')
          .update({ deadline_date: editDeadline })
          .eq('deadline_date', oldDeadline)
      } else {
        await supabase.from('submission_deadlines').insert({ deadline_date: editDeadline })
      }
    }
    setSaving(false)
    setEditing(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Scheduled Dates</h2>
          <p className="text-sm text-gray-500 mt-0.5">Submission deadlines and their paired meeting dates.</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-6 py-3 font-medium text-gray-500">Submission Deadline</th>
              <th className="px-6 py-3 font-medium text-gray-500">Meeting Date</th>
              <th className="px-6 py-3 font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50 transition">
                {editing === row.id ? (
                  <>
                    <td className="px-6 py-3">
                      <input type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-6 py-3">
                      <input type="date" value={editMeeting} onChange={e => setEditMeeting(e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleSave(row.id, row.deadline_date)} disabled={saving}
                          className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition disabled:opacity-60">
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(null)}
                          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-3 text-gray-600">{row.deadline_date ? fmtDate(row.deadline_date) : <span className="text-gray-400 italic">—</span>}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{fmtDate(row.meeting_date)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(row)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(row.id, row.meeting_date)} disabled={deleting === row.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition disabled:opacity-60">
                          {deleting === row.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-400">No dates scheduled.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Add New Date</h2>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Submission Deadline</label>
            <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Meeting Date <span className="text-red-500">*</span></label>
            <input type="date" required value={newMeeting} onChange={e => setNewMeeting(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={adding}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60">
            {adding ? 'Adding…' : 'Add'}
          </button>
          {addError && <p className="text-sm text-red-600 w-full">{addError}</p>}
        </form>
      </div>
    </div>
  )
}
