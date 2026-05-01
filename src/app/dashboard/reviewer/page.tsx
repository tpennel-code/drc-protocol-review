import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

export default async function ReviewerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assignments } = await supabase
    .from('protocol_assignments')
    .select(`
      *,
      protocol:protocols(*)
    `)
    .eq('reviewer_id', user.id)
    .order('assigned_at', { ascending: false })

  const { data: myReviews } = await supabase
    .from('reviews')
    .select('protocol_id')
    .eq('reviewer_id', user.id)

  const reviewedIds = new Set(myReviews?.map(r => r.protocol_id) ?? [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Assigned Protocols</h1>
      {(!assignments || assignments.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          No protocols assigned to you yet.
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a: any) => {
            const protocol = a.protocol
            const outcome = (protocol?.final_outcome ?? 'pending') as OutcomeStatus
            const reviewed = reviewedIds.has(protocol?.id)
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
