'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserRole } from '@/lib/types'

const roleColors: Record<UserRole, string> = {
  reviewer: 'bg-gray-100 text-gray-700',
  executive: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
}

export default function ReviewerManager({ reviewers }: { reviewers: Profile[] }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState('')
  const [error, setError] = useState('')

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult('')
    setError('')

    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))

    const emailIdx = headers.findIndex(h => h.includes('email'))
    const firstIdx = headers.findIndex(h => h.includes('first') || h.includes('name'))
    const surnameIdx = headers.findIndex(h => h.includes('surname') || h.includes('last'))

    if (emailIdx === -1) {
      setError('CSV must have an "email" column.')
      setImporting(false)
      return
    }

    const supabase = createClient()
    let created = 0
    let skipped = 0

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''))
      const email = cols[emailIdx]
      if (!email) continue

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (existing) { skipped++; continue }

      const { data: authUser, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email)
      if (inviteErr || !authUser?.user) { skipped++; continue }

      await supabase.from('profiles').upsert({
        id: authUser.user.id,
        email,
        firstname: firstIdx >= 0 ? cols[firstIdx] : null,
        surname: surnameIdx >= 0 ? cols[surnameIdx] : null,
        role: 'reviewer',
      })
      created++
    }

    setImportResult(`Imported ${created} reviewer(s). Skipped ${skipped} (already exist or invalid).`)
    setImporting(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Import Reviewers from CSV</h2>
        <p className="text-sm text-gray-500 mb-4">
          Upload a CSV with at minimum an <code className="bg-gray-100 px-1 rounded">email</code> column.
          Optionally include <code className="bg-gray-100 px-1 rounded">firstname</code> and <code className="bg-gray-100 px-1 rounded">surname</code>.
          Reviewers will receive an invite email to set their password.
        </p>
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
          >
            {importing ? 'Importing…' : 'Upload CSV'}
          </button>
          {importResult && <p className="text-sm text-green-600">{importResult}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reviewers.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-gray-900 font-medium">
                  {r.firstname} {r.surname}
                </td>
                <td className="px-6 py-4 text-gray-500">{r.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleColors[r.role]}`}>
                    {r.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
