'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, ProtocolAssignment } from '@/lib/types'

export default function AssignReviewerPanel({
  protocolId,
  assignments,
  allReviewers,
  executiveId,
}: {
  protocolId: string
  assignments: (ProtocolAssignment & { reviewer: Profile })[]
  allReviewers: Profile[]
  executiveId: string
}) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const assignedIds = new Set(assignments.map(a => a.reviewer_id))
  const available = allReviewers.filter(r => !assignedIds.has(r.id))

  async function handleAssign() {
    if (!selectedId) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('protocol_assignments').insert({
      protocol_id: protocolId,
      reviewer_id: selectedId,
      assigned_by: executiveId,
      status: 'pending',
    })
    if (err) {
      setError(err.message)
    } else {
      setSelectedId('')
      router.refresh()
    }
    setSaving(false)
  }

  async function handleRemove(assignmentId: string) {
    const supabase = createClient()
    await supabase.from('protocol_assignments').delete().eq('id', assignmentId)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Reviewers</h2>

      {assignments.length === 0 ? (
        <p className="text-sm text-gray-400 mb-4">No reviewers assigned yet.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {assignments.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 text-sm">
              <span className="text-gray-800 font-medium">
                {a.reviewer?.firstname} {a.reviewer?.surname}
                <span className="text-gray-400 font-normal ml-2">({a.reviewer?.email})</span>
              </span>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  a.status === 'completed' ? 'bg-green-100 text-green-700' :
                  a.status === 'in_review' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {a.status}
                </span>
                <button
                  onClick={() => handleRemove(a.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="flex gap-3">
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select reviewer to assign…</option>
            {available.map(r => (
              <option key={r.id} value={r.id}>
                {r.firstname} {r.surname} ({r.email})
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedId || saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
          >
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
