'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { declineAssignment } from '@/lib/assignmentActions'

export default function DeclineProtocolButton({
  assignmentId,
  protocolSerial,
}: {
  assignmentId: string
  protocolSerial: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [declining, setDeclining] = useState(false)
  const [error, setError] = useState('')

  async function handleDecline() {
    setDeclining(true)
    setError('')
    const { error: err } = await declineAssignment(assignmentId, reason.trim())
    setDeclining(false)
    if (err) {
      setError(err)
      return
    }
    setOpen(false)
    setReason('')
    router.push('/dashboard/reviewer')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => { setReason(''); setError(''); setOpen(true) }}
        className="inline-flex items-center gap-1.5 text-sm font-medium bg-white border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-4 py-2 rounded-lg transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Decline to review
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Decline to Review?</h2>
            <p className="text-sm text-gray-500 mb-4">
              You are about to decline the review of <strong>{protocolSerial ?? 'this protocol'}</strong>. The Chair will be notified by email and can assign another reviewer.
            </p>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Conflict of interest, on leave during meeting…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setOpen(false); setReason(''); setError('') }}
                disabled={declining}
                className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={declining}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-60"
              >
                {declining ? 'Declining…' : 'Decline & notify Chair'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
