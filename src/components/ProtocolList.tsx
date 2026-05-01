'use client'

import { useState } from 'react'
import Link from 'next/link'
import { OutcomeStatus } from '@/lib/types'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

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

const STATUS_OPTIONS: { value: OutcomeStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'fast_track_accepted', label: 'Fast Track Accepted' },
  { value: 'fast_track_rejected', label: 'Fast Track Rejected' },
  { value: 'minor_amendment', label: 'Minor Amendment' },
  { value: 'major_amendment', label: 'Major Amendment' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'rolled_over', label: 'Rolled Over' },
  { value: 'Unclassified', label: 'Unclassified' },
  { value: 'na', label: 'N/A' },
]

type Protocol = {
  id: string
  title: string | null
  serial_text: string | null
  applicant_firstname: string | null
  applicant_surname: string | null
  study_type: string | null
  degree: string | null
  submitted_at: string | null
  approval_date: string | null
  final_outcome: OutcomeStatus
}

export default function ProtocolList({ protocols, reviewersByProtocol = {} }: { protocols: Protocol[], reviewersByProtocol?: Record<string, string[]> }) {
  const [statusFilter, setStatusFilter] = useState<OutcomeStatus | 'all'>('all')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  function sortKey(p: Protocol): number {
    if (p.submitted_at) return new Date(p.submitted_at).getTime()
    if (p.serial_text) {
      const parts = p.serial_text.split('/')
      if (parts.length === 2) {
        const yr = parseInt(parts[0], 10)
        const seq = parseInt(parts[1], 10)
        // Scale to timestamp magnitude so serial-derived keys sort correctly
        // relative to real timestamps (~1.7e12). yr=2024,seq=1 → 2.024e12.
        if (!isNaN(yr) && !isNaN(seq)) return yr * 1e9 + seq * 1000
      }
    }
    return 0
  }

  const filtered = protocols
    .filter(p => statusFilter === 'all' || p.final_outcome === statusFilter)
    .slice()
    .sort((a, b) => {
      const da = sortKey(a)
      const db = sortKey(b)
      return sortDir === 'desc' ? db - da : da - db
    })

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-3 mb-5">
        {/* Status filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-300 bg-white px-3 py-2 rounded-lg hover:border-gray-400 transition"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
            </svg>
            {statusFilter === 'all' ? 'All Outcomes' : STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-48">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value); setDropdownOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    statusFilter === opt.value
                      ? 'bg-gray-50 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-300 bg-white px-3 py-2 rounded-lg hover:border-gray-400 transition"
        >
          Date Submitted
          <span>{sortDir === 'desc' ? '↓' : '↑'}</span>
        </button>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400 mb-3">{filtered.length} protocol{filtered.length !== 1 ? 's' : ''}</p>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(protocol => {
          const outcome = (protocol.final_outcome ?? 'pending') as OutcomeStatus
          return (
            <Link
              key={protocol.id}
              href={`/dashboard/executive/protocols/${protocol.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{protocol.title || 'Untitled Protocol'}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {protocol.serial_text} · {protocol.applicant_firstname} {protocol.applicant_surname}
                  </p>
                  <div className="flex items-center justify-between gap-3 mt-1">
                    <p className="text-xs text-gray-400">
                      {[protocol.study_type, protocol.degree].filter(Boolean).join(' · ')}
                      {protocol.submitted_at && (
                        <span className="ml-2">
                          · Submitted {fmtDate(protocol.submitted_at)}
                        </span>
                      )}
                      {outcome === 'approved' && protocol.approval_date && (
                        <span className="ml-2 text-green-600">
                          · Approved {fmtDate(protocol.approval_date)}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                      {(reviewersByProtocol[protocol.id]?.length ?? 0) > 0 ? (
                        reviewersByProtocol[protocol.id].map((name, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No reviewers assigned</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${outcomeBadge[outcome]}`}>
                  {outcomeLabel[outcome]}
                </span>
              </div>
            </Link>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-12">No protocols match this filter.</p>
        )}
      </div>
    </div>
  )
}
