import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { email, password, professional_title, firstname, surname, division, portfolio, role } = body
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: password || 'ChangeMe2024!',
    email_confirm: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { error: profileError } = await admin.from('profiles').upsert({
    id: data.user.id,
    email,
    professional_title: professional_title || null,
    firstname: firstname || null,
    surname: surname || null,
    division: division || null,
    portfolio: portfolio || null,
    role: role || 'reviewer',
  })

  if (profileError) {
    return NextResponse.json({ error: `User created but profile save failed: ${profileError.message}` }, { status: 500 })
  }

  return NextResponse.json({ id: data.user.id })
}
