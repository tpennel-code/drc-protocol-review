'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'

export default function ProfileForm({ profile }: { profile: Profile | null }) {
  const router = useRouter()

  const [firstname, setFirstname] = useState(profile?.firstname ?? '')
  const [surname, setSurname] = useState(profile?.surname ?? '')
  const [professionalTitle, setProfessionalTitle] = useState(profile?.professional_title ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [division, setDivision] = useState(profile?.division ?? '')
  const [portfolio, setPortfolio] = useState(profile?.portfolio ?? '')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)
    const supabase = createClient()

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        firstname: firstname || null,
        surname: surname || null,
        professional_title: professionalTitle || null,
        division: division || null,
        portfolio: portfolio || null,
      })
      .eq('id', profile!.id)

    if (profileError) {
      setError(profileError.message)
      setSaving(false)
      return
    }

    const authUpdates: { email?: string; password?: string } = {}
    if (email !== profile?.email) authUpdates.email = email
    if (newPassword) authUpdates.password = newPassword

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.updateUser(authUpdates)
      if (authError) {
        setError(authError.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setNewPassword('')
    setConfirmPassword('')
    setSuccess(authUpdates.email ? 'Profile updated. Check your new email address to confirm the change.' : 'Profile updated successfully.')
    router.refresh()
  }

  const TITLES = ['Dr', 'A/Prof', 'Prof', 'Mr', 'Ms', 'Mrs']
  const DIVISIONS = [
    'Cardiothoracic Surgery', 'ENT', 'General Surgery', 'Global Surgery',
    'Ophthalmology', 'Orthopaedic Surgery', 'Paediatric Surgery', 'Urology',
  ]
  const PORTFOLIOS = [
    'AEC', 'Chairperson', 'CRC protocol review',
    'MMed Funding / Grant application support', 'MMed Support', 'Past Chair',
    'Protocol Review', "Red Cross Children's Hospital", 'Research Integrity',
    'UCT grants & Equipment', 'Website & Database',
  ]

  const inputCls = 'h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const selectCls = `h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`
  const label = (text: string) => <label className="block text-sm font-medium text-gray-700 mb-1">{text}</label>

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>

        {/* Rows 1–3 share the same width, driven by Row 3 (Division + Portfolio) */}
        <div className="inline-flex flex-col gap-5">

          {/* Row 1: Title | First Name | Surname */}
          <div className="flex items-end gap-3">
            <div className="shrink-0">
              {label('Title')}
              <select value={professionalTitle} onChange={e => setProfessionalTitle(e.target.value)} className={selectCls}>
                <option value="">—</option>
                {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1">
              {label('First Name')}
              <input type="text" value={firstname} onChange={e => setFirstname(e.target.value)} placeholder="First name" className={`w-full ${inputCls}`} />
            </div>
            <div className="flex-1">
              {label('Surname')}
              <input type="text" value={surname} onChange={e => setSurname(e.target.value)} placeholder="Surname" className={`w-full ${inputCls}`} />
            </div>
          </div>

          {/* Row 2: Email */}
          <div>
            {label('Email Address')}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className={`w-full ${inputCls}`} />
          </div>

          {/* Row 3: Division | Portfolio */}
          <div className="flex items-end gap-3">
            <div className="shrink-0">
              {label('Division')}
              <select value={division} onChange={e => setDivision(e.target.value)} className={selectCls}>
                <option value="">— Division —</option>
                {DIVISIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="shrink-0">
              {label('Portfolio')}
              <select value={portfolio} onChange={e => setPortfolio(e.target.value)} className={selectCls}>
                <option value="">— Portfolio —</option>
                {PORTFOLIOS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
        <p className="text-sm text-gray-500">Leave blank to keep your current password.</p>
        <div className="flex gap-3">
          <div className="w-44">
            {label('New Password')}
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className={`w-full ${inputCls}`} />
          </div>
          <div className="w-44">
            {label('Confirm New Password')}
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={`w-full ${inputCls}`} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
