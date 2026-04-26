import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewerManager from '@/components/ReviewerManager'

export default async function ReviewersPage() {
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

  const { data: reviewers } = await supabase
    .from('profiles')
    .select('*')
    .order('surname')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Reviewers</h1>
      <ReviewerManager reviewers={reviewers ?? []} />
    </div>
  )
}
