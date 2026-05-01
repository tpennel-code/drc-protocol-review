'use client'

import { useState } from 'react'
import Link from 'next/link'
import { OutcomeStatus } from '@/lib/types'

const outcomeBadge: Record<OutcomeStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  minor_amendment: 'bg-blue-100 text-blue-800',
  major_amendment: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
  rolled_over: 'bg-gray-100 text-gray-700',
  na: 'bg-gray-100 text-gray-500',
  Unclassified: 'bg-purple-100 text-purple-700',
  fast_track_accepted: 'bg-green-100 text-green-800',
  fast_track_rejected: 'bg-orange-100 text-orange-800',
}

const outcomeLabel: Record<OutcomeStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  minor_amendment: 'Minor Amendment',
  major_amendment: 'Major Amendment',
  rejected: 'Rejected',
  rolled_over: 'Rolled Over',
  na: 'N/A',
  Unclassified: 'Unclassified',
  fast_track_accepted: 'Fast Track Accepted',
  fast_track_rejected: 'Fast Track Rejected',
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Assignment = {
  id: string
  assigned_at: string | null
  protocol: any
}

function avgDays(times: number[]) {
  if (!times.length) return null
  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const d = avg / (1000 * 60 * 60 * 24)
  return d < 1 ? '<1 day' : `${d.toFixed(1)} days`
}

export default function ReviewerDashboardClient({
  assignments,
  reviewedIds,
  reviewSubmittedAt,
}: {
  assignments: Assignment[]
  reviewedIds: Set<string>
  reviewSubmittedAt: Map<string, string>
}) {
  const [filter, setFilter] = useState<'all' | 'pending'>('all')

  const visible = filter === 'pending'
    ? assignments.filter(a => !reviewedIds.has(a.protocol?.id))
    : assignments

  const submitted = assignments.filter(a => reviewedIds.has(a.protocol?.id))
  const pending = assignments.filter(a => !reviewedIds.has(a.protocol?.id))

  const responseTimes = submitted.flatMap(a => {
    const submittedAt = reviewSubmittedAt.get(a.protocol?.id)
    if (!a.assigned_at || !submittedAt) return []
    const ms = new Date(submittedAt).getTime() - new Date(a.assigned_at).getTime()
    return ms >= 0 ? [ms] : []
  })

  const avg = avgDays(responseTimes)

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Assigned</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{assignments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Submitted</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{submitted.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{pending.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Avg Response Time</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{avg ?? '—'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Assigned Protocols</h1>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 transition border-l border-gray-200 ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Awaiting Review ({assignments.filter(a => !reviewedIds.has(a.protocol?.id)).length})
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          {filter === 'pending' ? 'All reviews submitted — nothing pending.' : 'No protocols assigned to you yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => {
            const protocol = a.protocol
            const outcome = (protocol?.final_outcome ?? 'pending') as OutcomeStatus
            const reviewed = reviewedIds.has(protocol?.id)
            const submittedAt = reviewSubmittedAt.get(protocol?.id)
            return (
              <Link
                key={a.id}
                href={`/dashboard/reviewer/${protocol?.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{protocol?.title || 'Untitled Protocol'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {protocol?.serial_text} · {protocol?.applicant_firstname} {protocol?.applicant_surname}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{protocol?.study_type}</p>
                    <div className="flex gap-3 mt-2">
                      {a.assigned_at && (
                        <span className="text-xs text-gray-400">Assigned {formatDate(a.assigned_at)}</span>
                      )}
                      {reviewed && submittedAt && (
                        <span className="text-xs text-green-600">· Submitted {formatDate(submittedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${outcomeBadge[outcome]}`}>
                      {outcomeLabel[outcome]}
                    </span>
                    {reviewed ? (
                      <span className="text-xs text-green-600 font-medium">Review submitted</span>
                    ) : (
                      <span className="text-xs text-orange-500 font-medium">Awaiting your review</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
