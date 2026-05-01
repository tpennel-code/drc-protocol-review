'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Profile, ProtocolAssignment } from '@/lib/types'
import { saveAssignments } from '@/lib/assignmentActions'

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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const slot1 = assignments[0] ?? null
  const slot2 = assignments[1] ?? null

  const [reviewer1Id, setReviewer1Id] = useState(slot1?.reviewer_id ?? '')
  const [reviewer2Id, setReviewer2Id] = useState(slot2?.reviewer_id ?? '')

  // Re-sync dropdowns whenever the server sends updated assignment data
  useEffect(() => {
    setReviewer1Id(assignments[0]?.reviewer_id ?? '')
    setReviewer2Id(assignments[1]?.reviewer_id ?? '')
  }, [assignments[0]?.reviewer_id, assignments[1]?.reviewer_id])

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    const result = await saveAssignments(protocolId, reviewer1Id, reviewer2Id)
    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      router.refresh()
    }
    setSaving(false)
  }

  const reviewerOptions = allReviewers.map(r => ({
    id: r.id,
    label: `${r.professional_title ?? ''} ${r.firstname ?? ''} ${r.surname ?? ''}`.trim() +
      (r.id === executiveId ? ' (you)' : '') +
      (r.role === 'executive' || r.role === 'admin' ? ' · Exec' : ''),
  }))

  const statusColor = (status: string) =>
    status === 'completed' ? 'text-green-600' : status === 'in_review' ? 'text-blue-600' : 'text-yellow-600'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Assign Reviewers</h2>
      <p className="text-sm text-gray-400 mb-6">Assign up to two reviewers. Executives may assign themselves.</p>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Reviewer 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reviewer 1</label>
          <select
            value={reviewer1Id}
            onChange={e => setReviewer1Id(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Unassigned —</option>
            {reviewerOptions.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          {slot1 && (
            <p className={`text-xs mt-1.5 font-medium ${statusColor(slot1.status)}`}>
              Status: {slot1.status}
            </p>
          )}
        </div>

        {/* Reviewer 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reviewer 2</label>
          <select
            value={reviewer2Id}
            onChange={e => setReviewer2Id(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Unassigned —</option>
            {reviewerOptions
              .filter(r => r.id !== reviewer1Id)
              .map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
          </select>
          {slot2 && (
            <p className={`text-xs mt-1.5 font-medium ${statusColor(slot2.status)}`}>
              Status: {slot2.status}
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {saved && !error && <p className="text-sm text-green-600 mb-3">Saved successfully.</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save Assignments'}
      </button>
    </div>
  )
}
