import { simpleParser } from 'mailparser'

export interface ParsedEmlAttachment {
  filename: string
  content: Buffer
  contentType: string
}

export interface ParsedEml {
  submissionId: string | null
  submittedAt: string | null // ISO timestamp
  firstname: string | null
  surname: string | null
  email: string | null
  profTitle: string | null
  fastTracked: boolean
  title: string | null
  studyType: string | null
  degree: string | null
  supervisor: string | null
  submissionType: string | null
  resubNumber: string | null
  checklist: string | null
  protocolFileName: string | null
  datasheetFileName: string | null
  supplementaryFileName: string | null
  attachments: ParsedEmlAttachment[]
}

// Pull "<b>Label</b><br>value<br><br>" pairs out of the Drupal/PHPMailer HTML body.
function field(html: string, label: string): string | null {
  const re = new RegExp(`<b>${escapeRe(label)}</b><br>([\\s\\S]*?)<br><br>`, 'i')
  const m = html.match(re)
  if (!m) return null
  const raw = m[1]
  // Field values may wrap the value in an anchor (email / file links).
  const fileAnchor = raw.match(/type="[^"]*">([^<]+)<\/a>/)
  if (fileAnchor) return decode(fileAnchor[1])
  const mailAnchor = raw.match(/>([^<]+)<\/a>/)
  if (raw.includes('mailto:') && mailAnchor) return decode(mailAnchor[1])
  return decode(raw.replace(/<[^>]+>/g, '')) || null
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim()
}

export async function parseEml(buf: Buffer): Promise<ParsedEml> {
  const mail = await simpleParser(buf)
  const html = mail.html || mail.textAsHtml || ''

  // submission_id lives in the file URLs: /sdrc_protocol_submission/<id>/
  const idMatch = html.match(/sdrc_protocol_submission\/(\d+)\//)

  // "Submitted on Fri, 29/05/2026 - 17:35"
  let submittedAt: string | null = null
  const subOn = html.match(/Submitted on[^<]*?(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{1,2}):(\d{2})/)
  if (subOn) {
    const [, dd, mm, yyyy, hh, min] = subOn
    submittedAt = `${yyyy}-${mm}-${dd}T${hh.padStart(2, '0')}:${min}:00`
  }

  const fastTrackVal = field(html, 'Request Protocol Fast Track')

  const attachments: ParsedEmlAttachment[] = (mail.attachments || []).map((a) => ({
    filename: a.filename || 'attachment',
    content: a.content as Buffer,
    contentType: a.contentType || 'application/octet-stream',
  }))

  return {
    submissionId: idMatch ? idMatch[1] : null,
    submittedAt,
    firstname: field(html, 'Firstname'),
    surname: field(html, 'Surname'),
    email: field(html, 'Email'),
    profTitle: field(html, 'Professional Title'),
    fastTracked: !!fastTrackVal && fastTrackVal.toLowerCase().includes('fast track'),
    title: field(html, 'Protocol Title'),
    studyType: field(html, 'Protocol Description'),
    degree: field(html, 'Purpose of Protocol (degree)'),
    supervisor: field(html, 'Supervisor'),
    submissionType: field(html, 'Submission type'),
    resubNumber: field(html, 'Re-Submission Protocol Numer'),
    checklist: field(html, 'Checklist'),
    protocolFileName: field(html, 'Protocol file'),
    datasheetFileName: field(html, 'Datasheet file'),
    supplementaryFileName: field(html, 'Supplementary file'),
    attachments,
  }
}
