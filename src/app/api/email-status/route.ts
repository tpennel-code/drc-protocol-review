import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getEmailDeliveryStatus } from '@/lib/email'

// Poll Resend for the current delivery status of a protocol's most recent
// outcome email, persist it, and return it. Drives the "Verify delivery"
// action behind the email-sent pill.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { protocolId } = await req.json()
  if (!protocolId) return NextResponse.json({ error: 'protocolId required' }, { status: 400 })

  const { data: log } = await supabase
    .from('email_logs')
    .select('id, resend_message_id')
    .eq('protocol_id', protocolId)
    .not('resend_message_id', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!log?.resend_message_id) {
    return NextResponse.json({ error: 'No sent email on record to verify' }, { status: 404 })
  }

  const status = await getEmailDeliveryStatus(log.resend_message_id)
  if (!status) {
    return NextResponse.json({ error: 'Could not reach Resend for delivery status' }, { status: 502 })
  }

  const checkedAt = new Date().toISOString()
  await supabase
    .from('email_logs')
    .update({ delivery_status: status, delivery_checked_at: checkedAt })
    .eq('id', log.id)

  return NextResponse.json({ status, checkedAt })
}
