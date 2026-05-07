import { Resend } from 'resend'

const DEFAULT_FROM = 'Surgical DRC <onboarding@resend.dev>'

type Attachment = {
  filename: string
  content: Buffer | string
}

export type EmailArgs = {
  from?: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
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
      subject: `[TEST] ${args.subject}`,
      text: args.text ? `${notice}\n${args.text}` : undefined,
      html: args.html
        ? `<pre style="background:#fef3c7;border:1px solid #f59e0b;padding:12px;font-family:monospace;font-size:12px;color:#92400e;white-space:pre-wrap;margin-bottom:16px">${escapeHtml(notice)}</pre>${args.html}`
        : undefined,
    }
  } else {
    payload = { ...args, from }
  }

  const resend = new Resend(apiKey)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return resend.emails.send(payload as any)
}
