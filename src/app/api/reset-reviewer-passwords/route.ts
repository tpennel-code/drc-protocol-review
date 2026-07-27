import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { defaultReviewerPassword } from '@/lib/passwords'

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
    .select('id, email, surname, archived')

  if (!profiles) return NextResponse.json({ error: 'No profiles found' }, { status: 500 })

  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const p of profiles) {
    const newPassword = defaultReviewerPassword(p.surname)
    if (p.archived || !newPassword) { skipped++; continue }
    const { error } = await admin.auth.admin.updateUserById(p.id, {
      email: p.email,
      email_confirm: true,
      password: newPassword,
    })
    if (error) {
      errors.push(`${p.surname}: ${error.message}`)
      skipped++
    } else {
      // Force a password change on next login.
      await admin.from('profiles').update({ must_change_password: true }).eq('id', p.id)
      updated++
    }
  }

  return NextResponse.json({ updated, skipped, errors })
}
