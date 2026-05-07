import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { renderToBuffer } from '@react-pdf/renderer'
import { ApprovalLetterPDF } from '@/lib/approval-letter-pdf'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createElement } from 'react'

const LETTER_CONFIG = {
  approved: {
    subject: 'DRC Protocol Outcome - Approved',
    bodyLine: 'Please see the attached approval letter.',
    filename: (serial: string) => `DRC_Approval_${serial}.pdf`,
  },
  minor_amendment: {
    subject: 'DRC Protocol Outcome - Minor Amendment Required',
    bodyLine: 'Please see the attached minor amendment letter.',
    filename: (serial: string) => `DRC_Minor_Amendment_${serial}.pdf`,
  },
  major_amendment: {
    subject: 'DRC Protocol Outcome - Amendment Required',
    bodyLine: 'Please see the attached amendment letter.',
    filename: (serial: string) => `DRC_Amendment_${serial}.pdf`,
  },
  fast_track_rejected: {
    subject: 'DRC Protocol Outcome - Fast Track Review',
    bodyLine: 'Please see the attached letter regarding your fast track submission.',
    filename: (serial: string) => `DRC_FastTrack_${serial}.pdf`,
  },
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { protocolId, letterType } = await req.json()
  if (!protocolId) return NextResponse.json({ error: 'protocolId required' }, { status: 400 })

  const type = letterType as 'approved' | 'minor_amendment' | 'major_amendment' | 'fast_track_rejected'
  const config = LETTER_CONFIG[type]
  if (!config) return NextResponse.json({ error: 'Invalid letterType' }, { status: 400 })

  const [{ data: protocol }, { data: chair }] = await Promise.all([
    supabase.from('protocols').select('*').eq('id', protocolId).single(),
    supabase.from('profiles')
      .select('professional_title, firstname, surname, email, signature_url')
      .eq('portfolio', 'Chairperson')
      .single(),
  ])

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })
  if (type !== 'fast_track_rejected' && protocol.final_outcome !== type) {
    return NextResponse.json({ error: `Protocol outcome is not ${type}` }, { status: 400 })
  }
  if (type === 'fast_track_rejected' && !protocol.fast_tracked) {
    return NextResponse.json({ error: 'Protocol is not marked as fast tracked' }, { status: 400 })
  }
  if (!protocol.applicant_email) return NextResponse.json({ error: 'No applicant email on record' }, { status: 400 })

  const uctLogoBase64 = readFileSync(join(process.cwd(), 'public', 'uct-shield.png')).toString('base64')
  const drcLogoBase64 = readFileSync(join(process.cwd(), 'public', 'drc-logo.png')).toString('base64')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    createElement(ApprovalLetterPDF, { protocol, chair, uctLogoBase64, drcLogoBase64, letterType: type }) as any
  )

  const chairName = chair
    ? [chair.professional_title, chair.firstname, chair.surname].filter(Boolean).join(' ')
    : 'Claire Warden'

  const salutation = [protocol.applicant_title, protocol.applicant_surname].filter(Boolean).join(' ')
  const projectTitle = protocol.approved_title || protocol.title || ''
  const serial = protocol.serial_text ?? protocolId

  const emailBody = `Dear ${salutation}\n\nThank you for submitting your protocol entitled: '${projectTitle}'.  ${config.bodyLine}\n\nKind Regards\n${chairName}\n\n`

  const { error } = await sendEmail({
    to: protocol.applicant_email,
    subject: config.subject,
    text: emailBody,
    attachments: [
      {
        filename: config.filename(serial),
        content: pdfBuffer,
      },
    ],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
