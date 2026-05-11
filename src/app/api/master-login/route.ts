import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const masterPassword = process.env.MASTER_PASSWORD
  if (!masterPassword || password !== masterPassword) {
    return NextResponse.json({ error: 'Invalid' }, { status: 401 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('id, surname')
    .eq('email', email)
    .single()

  if (!profile?.surname) {
    return NextResponse.json({ error: 'No surname on file for this user' }, { status: 404 })
  }

  // Pad short surnames so they meet Supabase password min length
  const newPassword = profile.surname.length >= 6 ? profile.surname : profile.surname + '2024'

  const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
    email,
    email_confirm: true,
    password: newPassword,
  })

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ password: newPassword })
}
