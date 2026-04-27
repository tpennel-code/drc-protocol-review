import { createClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, professional_title, firstname, surname')
    .not('email', 'ilike', '%@demo.drc')
    .not('firstname', 'is', null)
    .order('surname')

  const reviewers = (profiles ?? []).map(p => ({
    id: p.id,
    email: p.email,
    label: [p.professional_title, p.firstname, p.surname].filter(Boolean).join(' '),
  }))

  return <LoginForm reviewers={reviewers} />
}
