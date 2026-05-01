import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewerDashboardClient from './ReviewerDashboardClient'

export default async function ReviewerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assignments } = await supabase
    .from('protocol_assignments')
    .select('*, protocol:protocols(*)')
    .eq('reviewer_id', user.id)
    .order('assigned_at', { ascending: false })

  const { data: myReviews } = await supabase
    .from('reviews')
    .select('protocol_id, submitted_at')
    .eq('reviewer_id', user.id)

  return (
    <ReviewerDashboardClient
      assignments={assignments ?? []}
      myReviews={myReviews ?? []}
    />
  )
}
