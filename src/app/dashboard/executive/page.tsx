import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProtocolList from '@/components/ProtocolList'

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

  const [{ data: protocols }, { data: assignments }] = await Promise.all([
    supabase
      .from('protocols')
      .select('*')
      .eq('omit_record', false)
      .order('serial_text', { ascending: false })
      .limit(10000),
    supabase
      .from('protocol_assignments')
      .select('protocol_id, reviewer:profiles(professional_title, firstname, surname)'),
  ])

  const all = protocols ?? []
  const counts = {
    total: all.length,
    pending: all.filter(p => p.final_outcome === 'pending').length,
    approved: all.filter(p => p.final_outcome === 'approved').length,
  }

  // Build map: protocol_id -> reviewer display names
  const reviewersByProtocol: Record<string, string[]> = {}
  for (const a of assignments ?? []) {
    const r = a.reviewer as { professional_title: string | null; firstname: string | null; surname: string | null } | null
    if (!r) continue
    const name = [r.professional_title, r.firstname, r.surname].filter(Boolean).join(' ')
    if (!reviewersByProtocol[a.protocol_id]) reviewersByProtocol[a.protocol_id] = []
    reviewersByProtocol[a.protocol_id].push(name)
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

      <ProtocolList protocols={all} reviewersByProtocol={reviewersByProtocol} />
    </div>
  )
}
