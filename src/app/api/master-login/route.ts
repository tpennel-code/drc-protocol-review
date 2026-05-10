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

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (error || !data?.properties?.email_otp) {
    return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 })
  }

  return NextResponse.json({ token: data.properties.email_otp })
}
