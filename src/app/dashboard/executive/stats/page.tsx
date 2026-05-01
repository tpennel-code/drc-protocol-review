import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const outcomeLabel: Record<string, string> = {
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

const outcomeColor: Record<string, string> = {
  pending: 'bg-yellow-400',
  approved: 'bg-green-500',
  minor_amendment: 'bg-blue-400',
  major_amendment: 'bg-orange-400',
  rejected: 'bg-red-500',
  rolled_over: 'bg-gray-400',
  na: 'bg-gray-300',
  Unclassified: 'bg-purple-400',
  fast_track_accepted: 'bg-green-400',
  fast_track_rejected: 'bg-orange-500',
}

function avgDays(ms: number) {
  const d = ms / (1000 * 60 * 60 * 24)
  return d < 1 ? '<1' : d.toFixed(1)
}

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    redirect('/dashboard/reviewer')
  }

  const [
    { data: protocols },
    { data: assignments },
    { data: reviews },
    { data: reviewers },
  ] = await Promise.all([
    supabase.from('protocols').select('final_outcome, year').eq('omit_record', false),
    supabase.from('protocol_assignments').select('protocol_id, reviewer_id, assigned_at'),
    supabase.from('reviews').select('protocol_id, reviewer_id, submitted_at'),
    supabase.from('profiles').select('id, professional_title, firstname, surname').eq('role', 'reviewer'),
  ])

  // Outcome counts
  const outcomeCounts: Record<string, number> = {}
  for (const p of protocols ?? []) {
    const key = p.final_outcome ?? 'pending'
    outcomeCounts[key] = (outcomeCounts[key] ?? 0) + 1
  }
  const total = protocols?.length ?? 0
  const maxOutcomeCount = Math.max(...Object.values(outcomeCounts), 1)

  // Average response time (assignment → review submission)
  const assignmentMap = new Map<string, string>()
  for (const a of assignments ?? []) {
    assignmentMap.set(`${a.protocol_id}:${a.reviewer_id}`, a.assigned_at)
  }

  const responseTimes: number[] = []
  const reviewerTimes: Record<string, number[]> = {}
  const reviewerCounts: Record<string, number> = {}

  for (const r of reviews ?? []) {
    const assigned = assignmentMap.get(`${r.protocol_id}:${r.reviewer_id}`)
    if (!assigned || !r.submitted_at) continue
    const ms = new Date(r.submitted_at).getTime() - new Date(assigned).getTime()
    if (ms < 0) continue
    responseTimes.push(ms)
    if (!reviewerTimes[r.reviewer_id]) reviewerTimes[r.reviewer_id] = []
    reviewerTimes[r.reviewer_id].push(ms)
    reviewerCounts[r.reviewer_id] = (reviewerCounts[r.reviewer_id] ?? 0) + 1
  }

  const overallAvgMs = responseTimes.length
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : null

  // Reviewer leaderboard
  const reviewerMap = new Map((reviewers ?? []).map(r => [r.id, r]))
  const leaderboard = Object.entries(reviewerCounts)
    .map(([id, count]) => {
      const times = reviewerTimes[id] ?? []
      const avgMs = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null
      const r = reviewerMap.get(id)
      const name = r ? [r.professional_title, r.firstname, r.surname].filter(Boolean).join(' ') : 'Unknown'
      return { id, name, count, avgMs }
    })
    .sort((a, b) => b.count - a.count)

  // Year breakdown
  const yearCounts: Record<string, number> = {}
  for (const p of protocols ?? []) {
    const y = p.year ?? 'Unknown'
    yearCounts[y] = (yearCounts[y] ?? 0) + 1
  }
  const years = Object.entries(yearCounts).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Protocol Statistics</h1>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Protocols" value={total} color="text-gray-900" />
        <StatCard label="Pending" value={outcomeCounts['pending'] ?? 0} color="text-yellow-600" />
        <StatCard label="Approved" value={outcomeCounts['approved'] ?? 0} color="text-green-600" />
        <StatCard
          label="Avg Response Time"
          value={overallAvgMs !== null ? `${avgDays(overallAvgMs)} days` : '—'}
          color="text-blue-600"
          sub={`across ${responseTimes.length} reviews`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Outcome breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Outcomes</h2>
          <div className="space-y-3">
            {Object.entries(outcomeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([outcome, count]) => (
                <div key={outcome}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{outcomeLabel[outcome] ?? outcome}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${outcomeColor[outcome] ?? 'bg-gray-400'}`}
                      style={{ width: `${(count / maxOutcomeCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Year breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">By Year</h2>
          <div className="space-y-3">
            {years.map(([year, count]) => (
              <div key={year}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{year}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-400"
                    style={{ width: `${(count / Math.max(...years.map(y => y[1]), 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviewer activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Reviewer Activity</h2>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews submitted yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                <th className="pb-2 font-medium">Reviewer</th>
                <th className="pb-2 font-medium text-right">Reviews</th>
                <th className="pb-2 font-medium text-right">Avg Response Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leaderboard.map(({ id, name, count, avgMs }) => (
                <tr key={id}>
                  <td className="py-2.5 text-gray-900">{name}</td>
                  <td className="py-2.5 text-right text-gray-700">{count}</td>
                  <td className="py-2.5 text-right text-gray-500">
                    {avgMs !== null ? `${avgDays(avgMs)} days` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
