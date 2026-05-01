'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AccountPage() {
  const [currentEmail, setCurrentEmail] = useState('')
  const [newEmail, setNewEmail]         = useState('')
  const [emailMsg, setEmailMsg]         = useState('')
  const [emailErr, setEmailErr]         = useState('')
  const [emailSaving, setEmailSaving]   = useState(false)

  const [newPassword, setNewPassword]   = useState('')
  const [confirmPw, setConfirmPw]       = useState('')
  const [pwMsg, setPwMsg]               = useState('')
  const [pwErr, setPwErr]               = useState('')
  const [pwSaving, setPwSaving]         = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setCurrentEmail(data.user.email)
    })
  }, [])

  async function handleEmailChange(e: FormEvent) {
    e.preventDefault()
    setEmailErr('')
    setEmailMsg('')
    setEmailSaving(true)
    const { error } = await createClient().auth.updateUser({ email: newEmail })
    if (error) { setEmailErr(error.message) }
    else {
      setEmailMsg(`A confirmation link has been sent to ${newEmail}. Click it to complete the change.`)
      setNewEmail('')
    }
    setEmailSaving(false)
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()
    setPwErr('')
    setPwMsg('')
    if (newPassword !== confirmPw) { setPwErr('Passwords do not match.'); return }
    if (newPassword.length < 6)    { setPwErr('Password must be at least 6 characters.'); return }
    setPwSaving(true)
    const { error } = await createClient().auth.updateUser({ password: newPassword })
    if (error) { setPwErr(error.message) }
    else {
      setPwMsg('Password updated successfully.')
      setNewPassword('')
      setConfirmPw('')
    }
    setPwSaving(false)
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>

      {/* Change email */}
      <div className="bg-white rounded-2xl border border-gray-200 p-7">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Email Address</h2>
        <p className="text-sm text-gray-500 mb-5">
          Current: <span className="font-medium text-gray-700">{currentEmail}</span>
        </p>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New email address</label>
            <input
              type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
              placeholder="new@example.com" className={inputCls}
            />
          </div>
          {emailErr && <p className="text-sm text-red-600">{emailErr}</p>}
          {emailMsg && <p className="text-sm text-green-600">{emailMsg}</p>}
          <button
            type="submit" disabled={emailSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-60"
          >
            {emailSaving ? 'Sending…' : 'Change Email'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-200 p-7">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••" className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
            <input
              type="password" required value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              placeholder="••••••••" className={inputCls}
            />
          </div>
          {pwErr && <p className="text-sm text-red-600">{pwErr}</p>}
          {pwMsg && <p className="text-sm text-green-600">{pwMsg}</p>}
          <button
            type="submit" disabled={pwSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-60"
          >
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
