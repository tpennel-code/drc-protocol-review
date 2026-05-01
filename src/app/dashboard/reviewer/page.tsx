import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewerDashboardClient from './ReviewerDashboardClient'

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
    .select('protocol_id, submitted_at')
    .eq('reviewer_id', user.id)

  const reviewedIds = new Set(myReviews?.map(r => r.protocol_id) ?? [])
  const reviewSubmittedAt = new Map(myReviews?.map(r => [r.protocol_id, r.submitted_at]) ?? [])

  return (
    <ReviewerDashboardClient
      assignments={assignments ?? []}
      reviewedIds={reviewedIds}
      reviewSubmittedAt={reviewSubmittedAt}
    />
  )
}
