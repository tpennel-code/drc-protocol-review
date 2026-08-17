'use client'

import { useState } from 'react'
import OutcomeEmailDialog from './OutcomeEmailDialog'
import type { EmailType } from '@/lib/types'

export default function EmailApplicantButton({
  protocolId,
  letterType,
  label,
}: {
  protocolId: string
  letterType: EmailType
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)

  if (sent) {
    return <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-100 text-green-700">Email Sent</span>
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        {label ?? 'Email Applicant'}
      </button>

      {open && (
        <OutcomeEmailDialog
          protocolId={protocolId}
          letterType={letterType}
          onClose={() => setOpen(false)}
          onSent={() => { setSent(true); setOpen(false) }}
        />
      )}
    </>
  )
}
