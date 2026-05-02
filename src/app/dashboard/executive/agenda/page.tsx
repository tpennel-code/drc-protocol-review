import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AgendaConfigForm from '@/components/AgendaConfigForm'

export default async function AgendaConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) redirect('/dashboard/reviewer')

  const [{ data: meetingDates }, { data: reviewers }] = await Promise.all([
    supabase.from('meeting_dates').select('id, meeting_date').order('meeting_date'),
    supabase.from('profiles')
      .select('id, professional_title, firstname, surname')
      .in('role', ['reviewer', 'executive', 'admin'])
      .eq('archived', false)
      .order('surname'),
  ])

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <a href="/dashboard/executive" className="text-sm text-gray-500 hover:text-gray-700">← Back to Dashboard</a>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Generate Meeting Agenda</h1>
      <AgendaConfigForm
        meetingDates={(meetingDates ?? []).map(m => ({ id: m.id, date: String(m.meeting_date) }))}
        reviewers={(reviewers ?? []).map(r => ({
          id: r.id,
          name: [r.professional_title, r.firstname, r.surname].filter(Boolean).join(' '),
        }))}
      />
    </div>
  )
}
