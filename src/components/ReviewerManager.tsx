'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserRole } from '@/lib/types'

const DIVISIONS = [
  'Cardiothoracic Surgery', 'ENT', 'General Surgery', 'Global Surgery',
  'Neurosurgery', 'Ophthalmology', 'Orthopaedic Surgery', 'Paediatric Surgery', 'Urology',
]

const PORTFOLIOS = [
  'AEC', 'Chairperson', 'CRC protocol review',
  'MMed Funding / Grant application support', 'MMed Support', 'Past Chair',
  'Protocol Review', "Red Cross Children's Hospital", 'Research Integrity',
  'UCT grants & Equipment', 'Website & Database',
]

const TITLES = ['Dr', 'A/Prof', 'Prof', 'Mr', 'Ms', 'Mrs']
const ROLES: UserRole[] = ['reviewer', 'executive', 'admin']

const roleColors: Record<UserRole, string> = {
  reviewer: 'bg-gray-100 text-gray-700',
  executive: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
}

type FormData = {
  professional_title: string
  firstname: string
  surname: string
  email: string
  division: string
  portfolio: string
  role: UserRole
}

const emptyForm: FormData = {
  professional_title: '', firstname: '', surname: '',
  email: '', division: '', portfolio: '', role: 'reviewer',
}

// Defined outside to prevent remount on parent re-render
function ReviewerForm({
  form,
  onChange,
}: {
  form: FormData
  onChange: (f: FormData) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
        <select
          value={form.professional_title}
          onChange={e => onChange({ ...form, professional_title: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">—</option>
          {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
        <input
          value={form.firstname}
          onChange={e => onChange({ ...form, firstname: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Surname</label>
        <input
          value={form.surname}
          onChange={e => onChange({ ...form, surname: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={e => onChange({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Division</label>
        <select
          value={form.division}
          onChange={e => onChange({ ...form, division: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Select —</option>
          {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Portfolio</label>
        <select
          value={form.portfolio}
          onChange={e => onChange({ ...form, portfolio: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Select —</option>
          {PORTFOLIOS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
    </div>
  )
}

export default function ReviewerManager({ reviewers }: { reviewers: Profile[] }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState('')
  const [importError, setImportError] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<FormData>(emptyForm)
  const [addError, setAddError] = useState('')
  const [addSaving, setAddSaving] = useState(false)

  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState<FormData>(emptyForm)
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [sigUploading, setSigUploading] = useState(false)
  const [sigPreview, setSigPreview] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [archiving, setArchiving] = useState<string | null>(null)
  const [resettingPasswords, setResettingPasswords] = useState(false)
  const [resetResult, setResetResult] = useState('')

  async function handleResetAllPasswords() {
    if (!confirm('Reset every active reviewer\'s password to their surname? Surnames shorter than 6 characters will be padded with "2024".')) return
    setResettingPasswords(true)
    setResetResult('')
    const res = await fetch('/api/reset-reviewer-passwords', { method: 'POST' })
    const json = await res.json()
    if (!res.ok) {
      setResetResult(`Failed: ${json.error || 'unknown error'}`)
    } else {
      setResetResult(`Reset ${json.updated} password(s). Skipped ${json.skipped}.` + (json.errors?.length ? ` Errors: ${json.errors.slice(0, 3).join('; ')}` : ''))
    }
    setResettingPasswords(false)
  }

  async function handleArchiveToggle(r: Profile) {
    setArchiving(r.id)
    const supabase = createClient()
    await supabase.from('profiles').update({ archived: !r.archived }).eq('id', r.id)
    setArchiving(null)
    router.refresh()
  }

  const filtered = reviewers.filter(r => {
    if (r.archived !== showArchived) return false
    const q = search.toLowerCase()
    return (
      r.firstname?.toLowerCase().includes(q) ||
      r.surname?.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.division?.toLowerCase().includes(q) ||
      r.portfolio?.toLowerCase().includes(q)
    )
  })

  function openEdit(r: Profile) {
    setEditTarget(r)
    setEditForm({
      professional_title: r.professional_title ?? '',
      firstname: r.firstname ?? '',
      surname: r.surname ?? '',
      email: r.email,
      division: r.division ?? '',
      portfolio: r.portfolio ?? '',
      role: r.role,
    })
    setSigPreview(r.signature_url ?? null)
    setEditError('')
  }

  async function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editTarget) return
    const file = e.target.files?.[0]
    if (!file) return
    setSigUploading(true)
    const supabase = createClient()
    const path = `${editTarget.id}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(path, file, { upsert: true })
    if (uploadError) {
      setEditError('Signature upload failed: ' + uploadError.message)
      setSigUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('signatures').getPublicUrl(path)
    await supabase.from('profiles').update({ signature_url: publicUrl }).eq('id', editTarget.id)
    setSigPreview(publicUrl)
    setSigUploading(false)
    router.refresh()
  }

  async function handleFieldChange(userId: string, field: string, value: string) {
    setSaving(userId + field)
    const supabase = createClient()
    await supabase.from('profiles').update({ [field]: value }).eq('id', userId)
    setSaving(null)
    router.refresh()
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddSaving(true)
    setAddError('')
    const supabase = createClient()

    const { data: existing } = await supabase.from('profiles').select('id').eq('email', addForm.email).single()
    if (existing) {
      setAddError('A reviewer with this email already exists.')
      setAddSaving(false)
      return
    }

    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: addForm.email, password: addForm.surname || undefined }),
    })
    const json = await res.json()
    if (!res.ok) { setAddError(json.error || 'Failed to create user.'); setAddSaving(false); return }

    await supabase.from('profiles').upsert({
      id: json.id,
      email: addForm.email,
      professional_title: addForm.professional_title || null,
      firstname: addForm.firstname || null,
      surname: addForm.surname || null,
      division: addForm.division || null,
      portfolio: addForm.portfolio || null,
      role: addForm.role,
    })

    setShowAdd(false)
    setAddForm(emptyForm)
    setAddSaving(false)
    router.refresh()
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setEditSaving(true)
    setEditError('')
    const supabase = createClient()

    const { error } = await supabase.from('profiles').update({
      professional_title: editForm.professional_title || null,
      firstname: editForm.firstname || null,
      surname: editForm.surname || null,
      email: editForm.email,
      division: editForm.division || null,
      portfolio: editForm.portfolio || null,
      role: editForm.role,
    }).eq('id', editTarget.id)

    if (error) {
      setEditError(error.message)
      setEditSaving(false)
      return
    }

    setEditTarget(null)
    setEditSaving(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteTarget.id }),
      })
      if (!res.ok) {
        const text = await res.text()
        let msg = 'Failed to delete user.'
        try { msg = JSON.parse(text).error ?? msg } catch {}
        alert(msg)
      } else {
        router.refresh()
      }
    } catch (err) {
      alert('Delete failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult('')
    setImportError('')
    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    const emailIdx = headers.findIndex(h => h.includes('email'))
    if (emailIdx === -1) { setImportError('CSV must have an "email" column.'); setImporting(false); return }
    const firstIdx = headers.findIndex(h => h.includes('first'))
    const surnameIdx = headers.findIndex(h => h.includes('surname') || h.includes('last'))
    const titleIdx = headers.findIndex(h => h.includes('title'))
    const divisionIdx = headers.findIndex(h => h.includes('division'))
    const portfolioIdx = headers.findIndex(h => h.includes('portfolio'))
    const supabase = createClient()
    let created = 0, skipped = 0
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''))
      const email = cols[emailIdx]
      if (!email) continue
      const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).single()
      if (existing) { skipped++; continue }
      const surname = surnameIdx >= 0 ? cols[surnameIdx] : undefined
      const res = await fetch('/api/create-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: surname || undefined }) })
      const json = await res.json()
      if (!res.ok) { skipped++; continue }
      await supabase.from('profiles').upsert({
        id: json.id, email,
        firstname: firstIdx >= 0 ? cols[firstIdx] : null,
        surname: surnameIdx >= 0 ? cols[surnameIdx] : null,
        professional_title: titleIdx >= 0 ? cols[titleIdx] : null,
        division: divisionIdx >= 0 ? cols[divisionIdx] : null,
        portfolio: portfolioIdx >= 0 ? cols[portfolioIdx] : null,
        role: 'reviewer',
      })
      created++
    }
    setImportResult(`Imported ${created} reviewer(s). Skipped ${skipped}.`)
    setImporting(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Add Reviewer</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <ReviewerForm form={addForm} onChange={setAddForm} />
              {addError && <p className="text-sm text-red-600">{addError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={addSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-60">
                  {addSaving ? 'Adding…' : 'Add Reviewer'}
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setAddForm(emptyForm) }}
                  className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Edit Reviewer</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <ReviewerForm form={editForm} onChange={setEditForm} />
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-60">
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditTarget(null)}
                  className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2">
                  Cancel
                </button>
              </div>
            </form>

            {/* Signature upload */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-3">Signature</p>
              {sigPreview ? (
                <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sigPreview} alt="Signature" className="h-20 object-contain" />
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-3">No signature uploaded yet.</p>
              )}
              <label className="cursor-pointer">
                <span className={`inline-block text-xs font-medium px-4 py-2 rounded-lg border transition ${sigUploading ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                  {sigUploading ? 'Uploading…' : sigPreview ? 'Replace Signature' : 'Upload Signature'}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={sigUploading}
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Remove Reviewer?</h2>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently remove <strong>{deleteTarget.professional_title} {deleteTarget.firstname} {deleteTarget.surname}</strong> from the system.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleDelete} disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-60">
                {deleting ? 'Removing…' : 'Remove'}
              </button>
              <button onClick={() => setDeleteTarget(null)}
                className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-2">Import Reviewers from CSV</h2>
        <p className="text-sm text-gray-500 mb-4">
          CSV must include an <code className="bg-gray-100 px-1 rounded">email</code> column. Optional: <code className="bg-gray-100 px-1 rounded">firstname</code>, <code className="bg-gray-100 px-1 rounded">surname</code>, <code className="bg-gray-100 px-1 rounded">title</code>, <code className="bg-gray-100 px-1 rounded">division</code>, <code className="bg-gray-100 px-1 rounded">portfolio</code>.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60">
            {importing ? 'Importing…' : 'Upload CSV'}
          </button>
          <button onClick={handleResetAllPasswords} disabled={resettingPasswords}
            className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60">
            {resettingPasswords ? 'Resetting…' : 'Reset All Passwords to Surname'}
          </button>
          {importResult && <p className="text-sm text-green-600">{importResult}</p>}
          {importError && <p className="text-sm text-red-600">{importError}</p>}
          {resetResult && <p className={`text-sm ${resetResult.startsWith('Failed') ? 'text-red-600' : 'text-green-600'}`}>{resetResult}</p>}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-gray-700">{filtered.length} {showArchived ? 'archived' : 'active'}</p>
            {!showArchived && (
              <button
                onClick={() => { setAddForm(emptyForm); setAddError(''); setShowAdd(true) }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition">
                + Add Reviewer
              </button>
            )}
            <button
              onClick={() => setShowArchived(v => !v)}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg transition">
              {showArchived ? 'Show Active' : 'Show Archived'}
            </button>
          </div>
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 font-medium text-gray-500">Division</th>
                <th className="px-4 py-3 font-medium text-gray-500">Portfolio</th>
                <th className="px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <select value={r.professional_title ?? ''} onChange={e => handleFieldChange(r.id, 'professional_title', e.target.value)}
                        disabled={saving === r.id + 'professional_title'}
                        className="rounded border border-gray-200 px-1.5 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                        <option value="">—</option>
                        {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="font-medium text-gray-900">{r.firstname} {r.surname}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className={r.email.endsWith('@drc.local') ? 'text-amber-500' : ''}>{r.email}</span>
                    {r.email.endsWith('@drc.local') && <span className="ml-1 text-xs text-amber-400">(placeholder)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select value={r.division ?? ''} onChange={e => handleFieldChange(r.id, 'division', e.target.value)}
                      disabled={saving === r.id + 'division'}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-full max-w-[200px]">
                      <option value="">— Select —</option>
                      {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={r.portfolio ?? ''} onChange={e => handleFieldChange(r.id, 'portfolio', e.target.value)}
                      disabled={saving === r.id + 'portfolio'}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-full max-w-[220px]">
                      <option value="">— Select —</option>
                      {PORTFOLIOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleColors[r.role]}`}>
                      {r.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!r.archived && (
                        <button onClick={() => openEdit(r)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" /></svg>
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleArchiveToggle(r)}
                        disabled={archiving === r.id}
                        className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1 rounded hover:bg-amber-50 transition disabled:opacity-50">
                        {archiving === r.id ? '…' : (
                          <>
                            {r.archived
                              ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" /></svg>
                            }
                            {r.archived ? 'Unarchive' : 'Archive'}
                          </>
                        )}
                      </button>
                      <button onClick={() => setDeleteTarget(r)}
                        className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
