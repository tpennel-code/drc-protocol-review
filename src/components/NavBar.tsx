'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import Link from 'next/link'

export default function NavBar({ profile }: { profile: Profile | null }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isExecutiveOrAdmin = profile?.role === 'executive' || profile?.role === 'admin'

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <span className="font-bold text-blue-700 text-lg">DRC Protocol Review</span>
            <div className="flex gap-4 text-sm font-medium">
              {isExecutiveOrAdmin ? (
                <>
                  <Link href="/dashboard/executive" className="text-gray-600 hover:text-blue-700 transition">Protocols</Link>
                  <Link href="/dashboard/executive/reviewers" className="text-gray-600 hover:text-blue-700 transition">Reviewers</Link>
                  {profile?.role === 'admin' && (
                    <Link href="/dashboard/admin" className="text-gray-600 hover:text-blue-700 transition">Executives</Link>
                  )}
                </>
              ) : (
                <Link href="/dashboard/reviewer" className="text-gray-600 hover:text-blue-700 transition">My Protocols</Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 capitalize">{profile?.role} · {profile?.firstname || profile?.email}</span>
            <Link href="/dashboard/profile" className="text-sm text-gray-500 hover:text-blue-700 transition">
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-red-600 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
