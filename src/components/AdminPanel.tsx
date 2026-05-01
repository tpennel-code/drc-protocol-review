'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserRole } from '@/lib/types'

const roles: UserRole[] = ['reviewer', 'executive', 'admin']

const roleColors: Record<UserRole, string> = {
  reviewer: 'bg-gray-100 text-gray-700',
  executive: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
}

export default function AdminPanel({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setSaving(userId)
    const supabase = createClient()
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setSaving(null)
    router.refresh()
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    setDeleting(userId)
    const res = await fetch('/api/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (!res.ok) {
      const { error } = await res.json()
      alert(error ?? 'Failed to delete user.')
    }
    setDeleting(null)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
            <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
            <th className="text-left px-6 py-3 font-medium text-gray-500">Role</th>
            <th className="text-left px-6 py-3 font-medium text-gray-500">Change Role</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map(u => (
            <tr key={u.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4 font-medium text-gray-900">
                {u.firstname} {u.surname}
                {u.id === currentUserId && <span className="ml-2 text-xs text-gray-400">(you)</span>}
              </td>
              <td className="px-6 py-4 text-gray-500">{u.email}</td>
              <td className="px-6 py-4">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleColors[u.role]}`}>
                  {u.role}
                </span>
              </td>
              <td className="px-6 py-4">
                {u.id !== currentUserId && (
                  <select
                    value={u.role}
                    disabled={saving === u.id}
                    onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  >
                    {roles.map(r => (
                      <option key={r} value={r} className="capitalize">{r}</option>
                    ))}
                  </select>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                {u.id !== currentUserId && (
                  <button
                    disabled={deleting === u.id}
                    onClick={() => handleDelete(u.id, `${u.firstname} ${u.surname}`)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                  >
                    {deleting === u.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
