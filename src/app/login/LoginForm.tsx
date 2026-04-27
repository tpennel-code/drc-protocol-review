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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4">

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

            <button
              type="submit"
              disabled={loading || !selectedId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
