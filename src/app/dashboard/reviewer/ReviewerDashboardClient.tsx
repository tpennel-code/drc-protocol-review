'use client'

import { useState } from 'react'
import Link from 'next/link'
import { OutcomeStatus } from '@/lib/types'

const outcomeBadge: Record<OutcomeStatus, string> = {
  pending:          'bg-yellow-100 text-yellow-800',
  approved:         'bg-green-100 text-green-800',
  minor_amendment:  'bg-blue-100 text-blue-800',
  major_amendment:  'bg-orange-100 text-orange-800',
  rejected:         'bg-red-100 text-red-800',
  rolled_over:      'bg-gray-100 text-gray-700',
  na:               'bg-gray-100 text-gray-500',
}

const outcomeLabel: Record<OutcomeStatus, string> = {
  pending:          'Pending',
  approved:         'Approved',
  minor_amendment:  'Minor Amendment',
  major_amendment:  'Major Amendment',
  rejected:         'Rejected',
  rolled_over:      'Rolled Over',
  na:               'N/A',
}

type Filter = 'all' | 'pending' | 'reviewed'

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtResponseTime(assignedAt: string, submittedAt: string): string {
  const ms   = new Date(submittedAt).getTime() - new Date(assignedAt).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60)  return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

export default function ReviewerDashboardClient({
  assignments,
  myReviews,
}: {
  assignments: any[]
  myReviews: { protocol_id: string; submitted_at: string }[]
}) {
  const [filter, setFilter] = useState<Filter>('all')

  // Build lookup: protocol_id → submitted_at
  const reviewMap = new Map(myReviews.map(r => [r.protocol_id, r.submitted_at]))

  const reviewed = assignments.filter(a => reviewMap.has(a.protocol?.id))
  const pending  = assignments.filter(a => !reviewMap.has(a.protocol?.id))

  // Average response time (reviewed only)
  const responseTimes = reviewed
    .map(a => {
      const submittedAt = reviewMap.get(a.protocol?.id)
      if (!a.assigned_at || !submittedAt) return null
      return new Date(submittedAt).getTime() - new Date(a.assigned_at).getTime()
    })
    .filter((ms): ms is number => ms !== null && ms > 0)

  const avgMs   = responseTimes.length ? responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length : null
  const avgLabel = avgMs === null ? '—'
    : avgMs < 3_600_000   ? `${Math.round(avgMs / 60000)}m`
    : avgMs < 86_400_000  ? `${Math.round(avgMs / 3_600_000)}h`
    : `${Math.round(avgMs / 86_400_000)}d`

  const displayed =
    filter === 'pending'  ? pending :
    filter === 'reviewed' ? reviewed :
    assignments

  return (
    <div className="space-y-6">
      {/* ── Stats ── */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center gap-6">
        {[
          { label: 'Total',        value: assignments.length, color: 'text-gray-900' },
          { label: 'Pending',      value: pending.length,     color: 'text-orange-600' },
          { label: 'Reviewed',     value: reviewed.length,    color: 'text-green-600' },
          { label: 'Avg response', value: avgLabel,           color: 'text-blue-600' },
        ].map((stat, i) => (
          <div key={stat.label} className={`flex items-center gap-3 ${i > 0 ? 'pl-6 border-l border-gray-100' : ''}`}>
            <span className="text-sm text-gray-500">{stat.label}</span>
            <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['all', 'pending', 'reviewed'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
              filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'all' ? `All (${assignments.length})` :
             f === 'pending' ? `Pending (${pending.length})` :
             `Reviewed (${reviewed.length})`}
          </button>
        ))}
      </div>

      {/* ── Protocol list ── */}
      {displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          {filter === 'pending'  ? 'No protocols awaiting your review.' :
           filter === 'reviewed' ? 'You have not submitted any reviews yet.' :
           'No protocols assigned to you yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((a: any) => {
            const protocol    = a.protocol
            const outcome     = (protocol?.final_outcome ?? 'pending') as OutcomeStatus
            const submittedAt = reviewMap.get(protocol?.id) ?? null
            const isReviewed  = !!submittedAt

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

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 mt-2.5 text-xs text-gray-400">
                      <span>
                        <span className="font-medium text-gray-500">Assigned:</span> {fmtDate(a.assigned_at)}
                      </span>
                      {isReviewed && (
                        <>
                          <span>·</span>
                          <span>
                            <span className="font-medium text-gray-500">Reviewed:</span> {fmtDate(submittedAt)}
                          </span>
                          <span>·</span>
                          <span className="text-blue-500 font-medium">
                            Response: {fmtResponseTime(a.assigned_at, submittedAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${outcomeBadge[outcome]}`}>
                      {outcomeLabel[outcome]}
                    </span>
                    {isReviewed ? (
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
