'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EmailType } from '@/lib/types'

type DraftAttachment = { reviewId: string; filename: string }

type Draft = {
  to: string
  subject: string
  body: string
  letterFilename: string
  reviewerAttachments: DraftAttachment[]
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

/**
 * Compose-before-send dialog for outcome emails.
 *
 * Fetches its own draft rather than taking it as props, so it behaves
 * identically wherever it's mounted — including the letter pages, which don't
 * load the protocol's reviews.
 */
export default function OutcomeEmailDialog({
  protocolId,
  letterType,
  onClose,
  onSent,
}: {
  protocolId: string
  letterType: EmailType
  onClose: () => void
  onSent: () => void
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [skipped, setSkipped] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const res = await fetch(
        `/api/outcome-email-draft?protocolId=${encodeURIComponent(protocolId)}&letterType=${encodeURIComponent(letterType)}`
      )
      const json = await res.json().catch(() => ({}))
      if (cancelled) return
      if (!res.ok) {
        setError(json.error ?? 'Could not prepare the email.')
        setLoading(false)
        return
      }
      setDraft(json)
      setSubject(json.subject)
      setBody(json.body)
      // Reviewer documents are ticked by default — sending them alongside the
      // letter is the whole point of composing here.
      setSelected(json.reviewerAttachments.map((a: DraftAttachment) => a.reviewId))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [protocolId, letterType])

  function toggle(reviewId: string) {
    setSelected(prev =>
      prev.includes(reviewId) ? prev.filter(id => id !== reviewId) : [...prev, reviewId]
    )
  }

  async function handleSend() {
    setSending(true)
    setError('')
    const res = await fetch('/api/send-approval-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocolId, letterType, subject, body, reviewAttachmentIds: selected }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(json.error ?? 'Failed to send email.')
      setSending(false)
      return
    }
    // Sent — but if a document's stored file had gone missing, say so plainly
    // rather than letting the dialog close as though everything went.
    if (json.skipped?.length) {
      setSkipped(json.skipped)
      setSending(false)
      router.refresh()
      return
    }
    onSent()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Send Email to Applicant</h2>

        {skipped.length > 0 ? (
          <>
            <p className="text-sm text-gray-700 mb-3">
              The email was sent, but these documents could not be attached — their stored
              files are missing. You may need to ask the reviewer to re-upload them.
            </p>
            <ul className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 list-disc list-inside">
              {skipped.map(name => <li key={name}>{name}</li>)}
            </ul>
            <div className="flex justify-end">
              <button
                onClick={onSent}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition"
              >
                Done
              </button>
            </div>
          </>
        ) : loading ? (
          <p className="text-sm text-gray-500">Preparing email…</p>
        ) : !draft ? (
          <>
            <p className="text-sm text-red-600 mb-6">{error}</p>
            <div className="flex justify-end">
              <button onClick={onClose} className="text-sm font-medium px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <p className="text-sm text-gray-600 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                {draft.to}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              {draft.reviewerAttachments.length > 0 || body.includes('REVIEWER COMMENTS') ? (
                <p className="text-xs text-gray-500 mb-2">
                  Reviewer comments are inserted below — please review before sending.
                </p>
              ) : null}
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={16}
                className={`${inputClass} font-mono text-xs leading-relaxed`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
              <p className="text-sm text-gray-600 mb-2">📎 {draft.letterFilename}</p>
              {draft.reviewerAttachments.length === 0 ? (
                <p className="text-xs text-gray-400">No reviewer documents uploaded for this protocol.</p>
              ) : (
                <div className="space-y-2">
                  {draft.reviewerAttachments.map(a => (
                    <label key={a.reviewId} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selected.includes(a.reviewId)}
                        onChange={() => toggle(a.reviewId)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {a.filename}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={sending}
                className="text-sm font-medium px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-60"
              >
                {sending ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
