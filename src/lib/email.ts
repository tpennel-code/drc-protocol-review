import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_FROM = 'Surgical DRC <noreply@surgicaldrc.co.za>'

// We send from a no-reply address, so replies are routed to the DRC chair's
// inbox via a Reply-To header. The chair is the profile whose portfolio is
// 'Chairperson'. Memoised per instance — the chair rarely changes, and a stale
// value only lasts until the next cold start.
let chairReplyToCache: string | null | undefined

async function getChairReplyTo(): Promise<string | undefined> {
  if (chairReplyToCache !== undefined) return chairReplyToCache ?? undefined

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return undefined

  const admin = createClient(url, key)
  const { data } = await admin
    .from('profiles')
    .select('email')
    .eq('portfolio', 'Chairperson')
    .single()

  chairReplyToCache = data?.email ?? null
  return chairReplyToCache ?? undefined
}

type Attachment = {
  filename: string
  content: Buffer | string
}

export type EmailArgs = {
  from?: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string | string[]
  subject: string
  text?: string
  html?: string
  attachments?: Attachment[]
}

const asList = (a: string | string[] | undefined): string[] =>
  !a ? [] : Array.isArray(a) ? a : [a]

const escapeHtml = (s: string) =>
  s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))

/**
 * Send an email via Resend. When EMAIL_TEST_RECIPIENT is set, all sends are
 * redirected to that address with a banner showing who would have received
 * the message in production. CC/BCC are dropped so nothing leaks.
 */
export async function sendEmail(args: EmailArgs) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — email not sent')
    return { data: null, error: { message: 'RESEND_API_KEY not set', name: 'config' as const } }
  }

  const testRecipient = process.env.EMAIL_TEST_RECIPIENT?.trim()
  const from = args.from ?? DEFAULT_FROM
  const replyTo = args.replyTo ?? (await getChairReplyTo())

  let payload: EmailArgs & { from: string }

  if (testRecipient) {
    const lines = [
      `[TEST MODE — redirected to ${testRecipient}]`,
      `Original To: ${asList(args.to).join(', ')}`,
      ...(asList(args.cc).length ? [`Original Cc: ${asList(args.cc).join(', ')}`] : []),
      ...(asList(args.bcc).length ? [`Original Bcc: ${asList(args.bcc).join(', ')}`] : []),
      '',
      '----- ORIGINAL MESSAGE BELOW -----',
      '',
    ]
    const notice = lines.join('\n')

    payload = {
      ...args,
      from,
      to: testRecipient,
      cc: undefined,
      bcc: undefined,
      replyTo,
      subject: `[TEST] ${args.subject}`,
      text: args.text ? `${notice}\n${args.text}` : undefined,
      html: args.html
        ? `<pre style="background:#fef3c7;border:1px solid #f59e0b;padding:12px;font-family:monospace;font-size:12px;color:#92400e;white-space:pre-wrap;margin-bottom:16px">${escapeHtml(notice)}</pre>${args.html}`
        : undefined,
    }
  } else {
    payload = {
      ...args,
      from,
      replyTo,
    }
  }

  const resend = new Resend(apiKey)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return resend.emails.send(payload as any)
}

function resendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — Resend query skipped')
    return null
  }
  return new Resend(apiKey)
}

/**
 * Ask Resend for the latest delivery event of a previously-sent message.
 * Returns the `last_event` string (e.g. 'delivered', 'bounced') or null on error.
 */
export async function getEmailDeliveryStatus(messageId: string): Promise<string | null> {
  const resend = resendClient()
  if (!resend) return null
  const { data, error } = await resend.emails.get(messageId)
  if (error || !data) return null
  return data.last_event ?? null
}

export type ResendListEmail = {
  id: string
  to: string[]
  subject: string
  last_event: string
  created_at: string
}

/**
 * Page through Resend's sent-email history (newest first). Resend retains
 * history for a limited, plan-dependent window, so this only surfaces recent
 * sends — enough to reconcile logs after the fact. `maxPages` caps the walk.
 */
export async function listResendEmails(maxPages = 20): Promise<ResendListEmail[]> {
  const resend = resendClient()
  if (!resend) return []

  const out: ResendListEmail[] = []
  let after: string | undefined
  for (let page = 0; page < maxPages; page++) {
    const { data, error } = await resend.emails.list(
      after ? { limit: 100, after } : { limit: 100 },
    )
    if (error || !data) break
    for (const e of data.data) {
      out.push({
        id: e.id,
        to: e.to ?? [],
        subject: e.subject ?? '',
        last_event: e.last_event ?? 'sent',
        created_at: e.created_at,
      })
    }
    if (!data.has_more || data.data.length === 0) break
    after = data.data[data.data.length - 1]?.id
    if (!after) break
  }
  return out
}
