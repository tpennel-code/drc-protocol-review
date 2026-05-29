'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ForcePasswordChange({ show }: { show: boolean }) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  if (!show) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    if (newPassword !== confirmPw) { setErr('Passwords do not match.'); return }
    if (newPassword.length < 6) { setErr('Password must be at least 6 characters.'); return }

    setSaving(true)
    const supabase = createClient()

    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) { setErr('Session expired. Please sign in again.'); setSaving(false); return }

    // Reject keeping a default-style "<Surname>123" password.
    const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
    if (pwErr) { setErr(pwErr.message); setSaving(false); return }

    // Clear the flag only after the password update succeeds.
    const { error: flagErr } = await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', user.id)
    if (flagErr) { setErr(flagErr.message); setSaving(false); return }

    router.refresh()
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-xl font-bold text-gray-900">Choose a new password</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          For security, you must replace the temporary password before continuing.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password" required value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••" className={inputCls} autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
            <input
              type="password" required value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="••••••••" className={inputCls}
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button
            type="submit" disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60"
          >
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
