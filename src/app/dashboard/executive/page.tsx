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
}

const outcomeLabel: Record<OutcomeStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  minor_amendment: 'Minor Amendment',
  major_amendment: 'Major Amendment',
  rejected: 'Rejected',
  rolled_over: 'Rolled Over',
  na: 'N/A',
}

export default async function ExecutiveDashboard() {
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

  const { data: protocols } = await supabase
    .from('protocols')
    .select('*')
    .eq('omit_record', false)
    .order('submitted_at', { ascending: false })

  // Fetch assignments separately to avoid nested join RLS issues
  const { data: allAssignments } = await supabase
    .from('protocol_assignments')
    .select('protocol_id, reviewer_id, status, reviewer:profiles(professional_title, firstname, surname)')
    .order('assigned_at')

  // Group assignments by protocol_id
  const assignmentsByProtocol = new Map<string, any[]>()
  for (const a of allAssignments ?? []) {
    const list = assignmentsByProtocol.get(a.protocol_id) ?? []
    list.push(a)
    assignmentsByProtocol.set(a.protocol_id, list)
  }

  const counts = {
    total: protocols?.length ?? 0,
    pending: protocols?.filter(p => p.final_outcome === 'pending').length ?? 0,
    approved: protocols?.filter(p => p.final_outcome === 'approved').length ?? 0,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Protocols</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{counts.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{counts.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{counts.approved}</p>
        </div>
      </div>

      <div className="space-y-3">
        {protocols?.map((protocol: any) => {
          const outcome = (protocol.final_outcome ?? 'pending') as OutcomeStatus
          const assignments: any[] = assignmentsByProtocol.get(protocol.id) ?? []
          const submittedDate = protocol.submitted_at
            ? new Date(protocol.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : null
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
                    {submittedDate && <span className="ml-2 text-gray-400">· {submittedDate}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{protocol.study_type}{protocol.degree ? ` · ${protocol.degree}` : ''}</p>

                  {/* Assigned reviewers */}
                  <div className="flex items-center gap-2 mt-2">
                    {assignments.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">No reviewers assigned</span>
                    ) : (
                      assignments.map((a: any) => {
                        const r = a.reviewer
                        const name = [r?.professional_title, r?.firstname, r?.surname].filter(Boolean).join(' ')
                        const statusColor = a.status === 'completed' ? 'bg-green-100 text-green-700' :
                          a.status === 'in_review' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        return (
                          <span key={a.reviewer_id} className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                            {name || 'Unknown'}
                          </span>
                        )
                      })
                    )}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${outcomeBadge[outcome]}`}>
                  {outcomeLabel[outcome]}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
