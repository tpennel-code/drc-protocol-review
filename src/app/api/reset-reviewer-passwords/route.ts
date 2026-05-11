import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, surname, archived')

  if (!profiles) return NextResponse.json({ error: 'No profiles found' }, { status: 500 })

  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const p of profiles) {
    if (p.archived || !p.surname) { skipped++; continue }
    const newPassword = p.surname.length >= 6 ? p.surname : p.surname + '2024'
    const { error } = await admin.auth.admin.updateUserById(p.id, { password: newPassword })
    if (error) {
      errors.push(`${p.surname}: ${error.message}`)
      skipped++
    } else {
      updated++
    }
  }

  return NextResponse.json({ updated, skipped, errors })
}
