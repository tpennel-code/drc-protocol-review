import { renderToBuffer } from '@react-pdf/renderer'
import { AgendaDocument } from './agenda-pdf'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createElement } from 'react'

type Protocol = {
  id: string
  serial_text: string | null
  title: string | null
  applicant_title: string | null
  applicant_firstname: string | null
  applicant_surname: string | null
}

export type AgendaPdfData = {
  meetingDateFormatted: string
  apologisedNames: string[]
  fastTracked: Protocol[]
  forReview: Protocol[]
  agendaSentTo: string
  nextMeeting: string | null
  chairName: string
  chairEmail: string
  signatureUrl: string | null
}

export async function renderAgendaPdf(data: AgendaPdfData): Promise<Buffer> {
  const uctShieldBase64 = readFileSync(join(process.cwd(), 'public', 'uct-shield.png')).toString('base64')
  const drcLogoBase64 = readFileSync(join(process.cwd(), 'public', 'drc-logo.png')).toString('base64')

  return renderToBuffer(
    createElement(AgendaDocument, {
      ...data,
      uctShieldBase64,
      drcLogoBase64,
    })
  )
}
