import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ScheduleManager from './ScheduleManager'

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    redirect('/dashboard/reviewer')
  }

  const { data: deadlines } = await supabase
    .from('submission_deadlines')
    .select('*')
    .order('deadline_date')

  const { data: meetings } = await supabase
    .from('meeting_dates')
    .select('*')
    .order('meeting_date')

  return (
    <ScheduleManager
      deadlines={deadlines ?? []}
      meetings={meetings ?? []}
    />
  )
}
