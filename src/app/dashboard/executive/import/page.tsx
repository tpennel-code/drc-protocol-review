import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EmlImporter from '@/components/EmlImporter'

export default async function ImportEmlPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'executive' && profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Submissions (.eml)</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-2xl">
        Drop Drupal submission notification emails here to add them to the database. Each
        protocol is matched on its submission ID (so re-importing is safe), its files are stored,
        and a serial number is assigned automatically.
      </p>
      <EmlImporter />
    </div>
  )
}
