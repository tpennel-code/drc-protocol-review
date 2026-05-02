import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProtocolList from '@/components/ProtocolList'
import MeetingDateManager from '@/components/MeetingDateManager'
import ExecutiveDashboardTabs from '@/components/ExecutiveDashboardTabs'

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

  const [{ data: protocols }, { data: assignments }, { data: reviews }, { data: meetingDatesRows }, { data: deadlineRows }] = await Promise.all([
    supabase
      .from('protocols')
      .select('*')
      .eq('omit_record', false)
      .order('serial_text', { ascending: false })
      .limit(10000),
    supabase
      .from('protocol_assignments')
      .select('protocol_id, reviewer_id, reviewer:profiles!reviewer_id(professional_title, firstname, surname)'),
    supabase
      .from('reviews')
      .select('protocol_id, reviewer_id'),
    supabase
      .from('meeting_dates')
      .select('id, meeting_date')
      .order('meeting_date'),
    supabase
      .from('submission_deadlines')
      .select('deadline_date')
      .order('deadline_date'),
  ])

  const all = protocols ?? []
  const counts = {
    total: all.length,
    pending: all.filter(p => p.final_outcome === 'pending').length,
    approved: all.filter(p => p.final_outcome === 'approved').length,
  }

  // Set of "<protocol_id>:<reviewer_id>" pairs that have a submitted review
  const submittedSet = new Set<string>()
  for (const r of reviews ?? []) submittedSet.add(`${r.protocol_id}:${r.reviewer_id}`)

  const reviewersByProtocol: Record<string, { name: string; submitted: boolean }[]> = {}
  for (const a of assignments ?? []) {
    const r = a.reviewer as { professional_title: string | null; firstname: string | null; surname: string | null } | null
    if (!r) continue
    const name = [r.professional_title, r.firstname, r.surname].filter(Boolean).join(' ')
    const submitted = submittedSet.has(`${a.protocol_id}:${a.reviewer_id}`)
    if (!reviewersByProtocol[a.protocol_id]) reviewersByProtocol[a.protocol_id] = []
    reviewersByProtocol[a.protocol_id].push({ name, submitted })
  }

  // Pair meeting dates with submission deadlines by rank
  const deadlines = (deadlineRows ?? []).map(r => r.deadline_date as string)
  const meetingRows = (meetingDatesRows ?? []).map((m, i) => ({
    id: m.id as string,
    meeting_date: m.meeting_date as string,
    deadline_date: deadlines[i] ?? null,
  }))

  const statsCards = (
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
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
      </div>
      <ExecutiveDashboardTabs
        protocolsContent={<>{statsCards}<ProtocolList protocols={all} reviewersByProtocol={reviewersByProtocol} /></>}
        meetingDatesContent={<MeetingDateManager rows={meetingRows} />}
      />
    </div>
  )
}
