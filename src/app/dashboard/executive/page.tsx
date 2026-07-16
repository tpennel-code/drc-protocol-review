import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/paginate'
import { redirect } from 'next/navigation'
import ProtocolList from '@/components/ProtocolList'
import MeetingDateManager from '@/components/MeetingDateManager'
import ExecutiveDashboardTabs from '@/components/ExecutiveDashboardTabs'
import BackfillEmailsButton from '@/components/BackfillEmailsButton'
import type { EmailPillData } from '@/lib/email-pill'

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

  const [protocols, [{ data: assignments }, { data: reviews }, { data: meetingDatesRows }, { data: deadlineRows }]] = await Promise.all([
    // Paged: PostgREST caps responses at 1000 rows, so `.limit()` alone undercounts.
    fetchAllRows((from, to) =>
      supabase
        .from('protocols')
        .select('*')
        .eq('omit_record', false)
        .order('serial_text', { ascending: false, nullsFirst: false })
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .range(from, to),
    ),
    Promise.all([
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
    ]),
  ])

  // Latest outcome-email send per protocol, for the "email sent" pill.
  const { data: emailLogs } = await supabase
    .from('email_logs')
    .select('protocol_id, email_type, recipient_email, delivery_status, delivery_checked_at, sent_at')
    .order('sent_at', { ascending: false })

  const emailByProtocol: Record<string, EmailPillData> = {}
  for (const l of emailLogs ?? []) {
    if (!l.protocol_id || emailByProtocol[l.protocol_id]) continue // rows are newest-first; keep the first
    emailByProtocol[l.protocol_id] = {
      emailType: l.email_type,
      recipient: l.recipient_email,
      sentAt: l.sent_at,
      status: l.delivery_status,
      checkedAt: l.delivery_checked_at,
    }
  }

  const all = protocols
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (a.reviewer as any) as { professional_title: string | null; firstname: string | null; surname: string | null } | null
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
      </div>
      <ExecutiveDashboardTabs
        protocolsContent={<>{statsCards}{profile.role === 'admin' && (<div className="flex justify-end mb-3"><BackfillEmailsButton /></div>)}<ProtocolList protocols={all} reviewersByProtocol={reviewersByProtocol} emailByProtocol={emailByProtocol} isAdmin={profile.role === 'admin'} /></>}
        meetingDatesContent={<MeetingDateManager rows={meetingRows} />}
      />
    </div>
  )
}
