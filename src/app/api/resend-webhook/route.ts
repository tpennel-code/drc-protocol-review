import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Webhook } from 'svix'
import type { DeliveryStatus } from '@/lib/types'

// Resend delivers webhooks signed with Svix. Events look like
// { type: 'email.delivered', data: { email_id, ... } }. We map the event onto
// our delivery_status and stamp it on the matching email_logs row, so the
// sent/delivered/bounced pill updates with no manual "Verify delivery" click.

const EVENT_TO_STATUS: Record<string, DeliveryStatus> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'delivery_delayed',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.failed': 'failed',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
}

// Webhook retries and out-of-order delivery mean a stale 'sent' can arrive
// after 'delivered'. Only move forward: never regress a row to a lower rank.
const RANK: Record<DeliveryStatus, number> = {
  queued: 1, scheduled: 1, sent: 2, delivery_delayed: 3,
  delivered: 4, opened: 5, clicked: 6,
  bounced: 9, complained: 9, failed: 9, canceled: 9,
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET not set — webhook rejected')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await req.text()
  const headers = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  }

  let event: { type?: string; data?: { email_id?: string } }
  try {
    event = new Webhook(secret).verify(body, headers) as typeof event
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const status = event.type ? EVENT_TO_STATUS[event.type] : undefined
  const emailId = event.data?.email_id
  // Ack unrecognised events / non-outcome messages so Resend stops retrying.
  if (!status || !emailId) return NextResponse.json({ ok: true, ignored: true })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )

  const { data: log } = await admin
    .from('email_logs')
    .select('id, delivery_status')
    .eq('resend_message_id', emailId)
    .maybeSingle()

  // No matching row (e.g. an email sent outside this app) — nothing to update.
  if (!log) return NextResponse.json({ ok: true, unmatched: true })

  const current = (log.delivery_status as DeliveryStatus | null) ?? null
  if (current && RANK[current] >= RANK[status]) {
    return NextResponse.json({ ok: true, skipped: 'not newer' })
  }

  await admin
    .from('email_logs')
    .update({ delivery_status: status, delivery_checked_at: new Date().toISOString() })
    .eq('id', log.id)

  return NextResponse.json({ ok: true, status })
}
