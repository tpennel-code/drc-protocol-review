'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Reviewer = { id: string; email: string; label: string }


export default function LoginForm({ reviewers }: { reviewers: Reviewer[] }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState('')
  const [surname, setSurname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleForgotPassword() {
    const reviewer = reviewers.find(r => r.id === selectedId)
    if (!reviewer) {
      setError('Please select your name first.')
      return
    }
    setResetLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(reviewer.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setResetLoading(false)
    if (error) {
      setError('Failed to send reset email. Please try again.')
    } else {
      setResetSent(true)
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Incorrect selection or surname. Please try again.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const reviewer = reviewers.find(r => r.id === selectedId)
    if (!reviewer) return
    await signIn(reviewer.email, surname)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 overflow-hidden">

      {/* Watermark */}
      <img
        src="/uct-logo-large.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute w-[200vw] top-[-30vh] object-contain"
        style={{ opacity: 0.06, left: 'calc(-50vw + 300px)' }}
      />

      <div className="relative w-full max-w-md space-y-4">

        {/* Login form */}
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">DRC Protocol Review</h1>
            <p className="text-sm text-gray-500 mt-1">Select your name and sign in</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <select
                required
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select your name…</option>
                {reviewers.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={surname}
                onChange={e => setSurname(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {resetSent && (
              <p className="text-sm text-green-600">Password reset email sent. Check your inbox.</p>
            )}

            <button
              type="submit"
              disabled={loading || !selectedId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading || resetSent}
                className="text-sm text-blue-600 hover:underline disabled:opacity-50"
              >
                {resetLoading ? 'Sending…' : 'Forgot password?'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
