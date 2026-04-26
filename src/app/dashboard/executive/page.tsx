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
                  <p className="text-xs text-gray-400 mt-1">{protocol.study_type} · {protocol.degree}</p>
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
