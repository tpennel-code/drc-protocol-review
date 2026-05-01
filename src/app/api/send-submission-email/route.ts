import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Sender: noreply@sdrc.uct.ac.za — domain must be verified in the Resend dashboard.

const ADMIN_EMAIL = 'tpennel@gmail.com'

function formatDate(iso: string) {
  const d = new Date(iso)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dd   = String(d.getDate()).padStart(2, '0')
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh   = String(d.getHours()).padStart(2, '0')
  const min  = String(d.getMinutes()).padStart(2, '0')
  return `${days[d.getDay()]}, ${dd}/${mm}/${yyyy} - ${hh}:${min}`
}

export async function POST(req: Request) {
  const body = await req.json()
  const {
    submittedAt, firstname, surname, email, profTitle,
    fastTrack, protocolTitle, fileNaming,
    protocolFile, datasheetFile, supplementaryFile,
    studyType, degree, supervisor, submissionType,
    resubNumber, checklist,
  } = body

  const dateStr = formatDate(submittedAt)
  const fastTrackLabel   = fastTrack === 'yes' ? 'Fast Track' : 'Not for Fast Track'
  const supervisorLabel  = supervisor === 'approved'
    ? 'Supervisor has read and approved protocol before submission'
    : 'N/A — This protocol does not have a supervisor attached'

  const subject = `DRC Protocol Submission Received – ${protocolTitle}`

  const textBody = `Submitted on ${dateStr}

Submitted by: ${firstname} ${surname}

Submitted values are:

Firstname
${firstname}

Surname
${surname}

Email
${email}

Professional Title
${profTitle}

Request Protocol Fast Track
${fastTrackLabel}

Protocol Title
${protocolTitle}

File naming
${fileNaming ? 'The Protocol filename conforms to website requirements' : 'Not confirmed'}

Protocol file
${protocolFile || '—'}

Datasheet file
${datasheetFile || '—'}

${supplementaryFile ? `Supplementary file\n${supplementaryFile}\n\n` : ''}Protocol Description
${studyType}

Purpose of Protocol (degree)
${degree}

Supervisor
${supervisorLabel}

Submission type
${submissionType}

${resubNumber ? `Re-Submission Protocol Number\n${resubNumber}\n\n` : ''}Checklist
${checklist ? 'I have read the protocol checklist' : 'Not confirmed'}

---
Data Review Committee · University of Cape Town
`

  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:6px 0;font-weight:600;color:#374151;width:220px;vertical-align:top">${label}</td>
      <td style="padding:6px 0;color:#111827">${value}</td>
    </tr>`

  const htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827">
  <div style="background:#1e40af;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="color:white;margin:0;font-size:18px">DRC Protocol Submission Confirmation</h1>
    <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Department of Surgery Research Committee · UCT</p>
  </div>
  <div style="background:white;border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 8px 8px">
    <p style="color:#6b7280;font-size:13px;margin-top:0">Submitted on <strong>${dateStr}</strong></p>
    <p style="color:#6b7280;font-size:13px">Submitted by: <strong>${firstname} ${surname}</strong></p>
    <h2 style="font-size:15px;color:#1e3a8a;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-top:24px">
      Submitted values
    </h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${row('Firstname', firstname)}
      ${row('Surname', surname)}
      ${row('Email', email)}
      ${row('Professional Title', profTitle)}
      ${row('Request Protocol Fast Track', fastTrackLabel)}
      ${row('Protocol Title', protocolTitle)}
      ${row('File naming', fileNaming ? 'The Protocol filename conforms to website requirements' : 'Not confirmed')}
      ${row('Protocol file', protocolFile || '—')}
      ${row('Datasheet file', datasheetFile || '—')}
      ${supplementaryFile ? row('Supplementary file', supplementaryFile) : ''}
      ${row('Protocol Description', studyType)}
      ${row('Purpose of Protocol (degree)', degree)}
      ${row('Supervisor', supervisorLabel)}
      ${row('Submission type', submissionType)}
      ${resubNumber ? row('Re-Submission Protocol Number', resubNumber) : ''}
      ${row('Checklist', checklist ? 'I have read the protocol checklist' : 'Not confirmed')}
    </table>
    <p style="margin-top:32px;font-size:13px;color:#6b7280">
      Your protocol has been received and will be reviewed by the DRC.
      You will be contacted at <strong>${email}</strong> with the outcome.
    </p>
  </div>
</div>`

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — email not sent')
    return NextResponse.json({ success: true })
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'No Reply <noreply@sdrc.uct.ac.za>',
    to: email,
    cc: ADMIN_EMAIL,
    subject,
    text: textBody,
    html: htmlBody,
  })

  if (error) console.error('Resend error:', error)

  return NextResponse.json({ success: true })
}
