'use client'

import { useState, useRef, forwardRef, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

const TITLES = ['Dr', 'Prof', 'A/Prof', 'Mr', 'Ms', 'Mrs', 'Other']

const STUDY_TYPES = [
  'Animal Study', 'Bench analysis', 'Case Series', 'Case Study',
  'Clinical Trial', 'Cross-sectional', 'Meta-Analysis', 'Other',
  'Prospective Cohort', 'Registry', 'Retrospective Cohort', 'Systematic Review',
]

const DEGREES = [
  'MMed', 'PhD', 'MPhil', 'MSc (Med)', 'MBChB', 'BSc (Hons)',
  'FCS (SA)', 'Non-degree purpose', 'Other Degree',
]

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

// ── small helpers ────────────────────────────────────────────────────────────

function Field({
  label, required, hint, children, className = '',
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

const FileField = forwardRef<
  HTMLInputElement,
  { label: string; required?: boolean; hint?: string; accept?: string }
>(({ label, required, hint, accept }, ref) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      ref={ref}
      type="file"
      accept={accept}
      required={required}
      className="block w-full text-sm text-gray-600
        file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
        file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700
        hover:file:bg-gray-200 cursor-pointer"
    />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
))
FileField.displayName = 'FileField'

// ── upload helper ────────────────────────────────────────────────────────────

async function uploadFile(file: File, folder: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  const res = await fetch('/api/upload-protocol-file', { method: 'POST', body: formData })
  const json = await res.json()
  if (!res.ok) throw new Error(`File upload failed: ${json.error}`)
  return json.path
}

// ── main form ────────────────────────────────────────────────────────────────

export default function SubmitForm() {
  const [firstname, setFirstname]           = useState('')
  const [surname, setSurname]               = useState('')
  const [email, setEmail]                   = useState('')
  const [profTitle, setProfTitle]           = useState('')
  const [fastTrack, setFastTrack]           = useState('')
  const [protocolTitle, setProtocolTitle]   = useState('')
  const [fileNaming, setFileNaming]         = useState(false)
  const [studyType, setStudyType]           = useState('')
  const [degree, setDegree]                 = useState('')
  const [supervisor, setSupervisor]         = useState('')
  const [submissionType, setSubmissionType] = useState('')
  const [resubNumber, setResubNumber]       = useState('')
  const [checklist, setChecklist]           = useState(false)

  const protocolFileRef     = useRef<HTMLInputElement>(null)
  const datasheetFileRef    = useRef<HTMLInputElement>(null)
  const supplementaryFileRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading]           = useState(false)
  const [progress, setProgress]             = useState('')
  const [error, setError]                   = useState('')
  const [showModal, setShowModal]           = useState(false)

  async function fillTestData() {
    setFirstname('Carl-Adriaan')
    setSurname('Hugo')
    setEmail('cahugo6@gmail.com')
    setProfTitle('Dr')
    setFastTrack('yes')
    setProtocolTitle('The Impact of Donor Vessel Multiplicity and Kidney Laterality on Donor Outcomes in a South African Cohort')
    setFileNaming(true)
    setStudyType('Retrospective Cohort')
    setDegree('Non-degree purpose')
    setSupervisor('approved')
    setSubmissionType('First Submission')
    setChecklist(true)

    const attachFetched = async (
      ref: React.RefObject<HTMLInputElement | null>,
      url: string,
      filename: string,
      type: string,
    ) => {
      if (!ref.current) return
      const res = await fetch(url)
      const blob = await res.blob()
      const dt = new DataTransfer()
      dt.items.add(new File([blob], filename, { type }))
      ref.current.files = dt.files
    }

    await Promise.all([
      attachFetched(
        protocolFileRef,
        '/test-files/test-protocol.docx',
        'ft-hugo-renal-transplant.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
      attachFetched(
        datasheetFileRef,
        '/test-files/test-datasheet.xlsx',
        'ft-hugo-renal-transplant-data-sheet.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ),
    ])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const protocolFile      = protocolFileRef.current?.files?.[0]
    const datasheetFile     = datasheetFileRef.current?.files?.[0]
    const supplementaryFile = supplementaryFileRef.current?.files?.[0]

    if (!protocolFile)  { setError('Protocol file is required.'); return }
    if (!datasheetFile) { setError('Datasheet file is required.'); return }

    setUploading(true)
    try {
      setProgress('Uploading protocol file…')
      const protocolPath = await uploadFile(protocolFile, 'protocols')

      setProgress('Uploading datasheet…')
      const datasheetPath = await uploadFile(datasheetFile, 'datasheets')

      let supplementaryPath: string | null = null
      if (supplementaryFile) {
        setProgress('Uploading supplementary file…')
        supplementaryPath = await uploadFile(supplementaryFile, 'supplementary')
      }

      setProgress('Saving submission…')
      const submittedAt = new Date().toISOString()
      const supabase = createClient()
      const { error: err } = await supabase.from('protocols').insert({
        applicant_firstname:         firstname,
        applicant_surname:           surname,
        applicant_email:             email,
        applicant_title:             profTitle,
        fast_tracked:                fastTrack === 'yes',
        title:                       protocolTitle,
        study_type:                  studyType,
        degree:                      degree,
        supervisor:                  supervisor,
        submission_type:             submissionType,
        if_resubmission_drc_number:  resubNumber || null,
        checklist:                   checklist ? 'confirmed' : null,
        protocol_file:               protocolPath,
        datasheet_file:              datasheetPath,
        supplementary_file:          supplementaryPath,
        final_outcome:               'pending',
        submitted_at:                submittedAt,
        year:                        String(new Date().getFullYear()),
        year_submitted:              String(new Date().getFullYear()),
      })
      if (err) throw new Error(err.message)

      // Send confirmation email (best-effort — don't block on failure)
      setProgress('Sending confirmation email…')
      await fetch('/api/send-submission-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submittedAt,
          firstname, surname, email, profTitle,
          fastTrack, protocolTitle, fileNaming,
          protocolFile:          protocolFile.name,
          datasheetFile:         datasheetFile.name,
          supplementaryFile:     supplementaryFile?.name ?? null,
          protocolFilePath:      protocolPath,
          datasheetFilePath:     datasheetPath,
          supplementaryFilePath: supplementaryPath,
          studyType, degree, supervisor, submissionType,
          resubNumber, checklist,
        }),
      }).catch(() => {/* email failure doesn't block success */})

      setShowModal(true)
    } catch (e: any) {
      setError(e.message || 'Submission failed. Please try again.')
    } finally {
      setUploading(false)
      setProgress('')
    }
  }

  return (
    <>
    {/* Success modal */}
    {showModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Protocol Submitted Successfully</h2>
          <p className="text-sm text-gray-500 mb-1">
            Thank you, <span className="font-medium text-gray-700">{firstname} {surname}</span>.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            A confirmatory email has been sent to <span className="font-medium text-gray-700">{email}</span>.
            The DRC will contact you with the outcome of the review.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    )}

    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-2">
      <span className="text-xs text-amber-700 font-medium">Sandbox / testing mode</span>
      <button
        type="button"
        onClick={() => { fillTestData() }}
        className="text-xs font-medium text-amber-800 border border-amber-300 bg-white px-3 py-1.5 rounded-lg hover:bg-amber-50 transition"
      >
        Autofill test data
      </button>
    </div>

    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Applicant details ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-7">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Applicant Details</h2>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Firstname" required>
            <input required value={firstname} onChange={e => setFirstname(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Surname" required>
            <input required value={surname} onChange={e => setSurname(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Email" required className="col-span-2">
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Professional Title" required>
            <select required value={profTitle} onChange={e => setProfTitle(e.target.value)} className={inputCls}>
              <option value="">— Select —</option>
              {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>
      </section>

      {/* ── Fast track ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-7">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Request Protocol Fast Track <span className="text-red-500">*</span>
        </h2>
        <p className="text-xs text-gray-500 mb-1">
          Protocols that do not make use of the provided proforma will not be considered for fast tracking and will
          automatically be rolled over to the next meeting.
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Only retrospective folder reviews / Registry analysis will be considered for fast tracking.
        </p>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Fast Track' },
            { value: 'no',  label: 'Not for Fast Track' },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input
                type="radio" required name="fasttrack" value={opt.value}
                checked={fastTrack === opt.value} onChange={() => setFastTrack(opt.value)}
                className="accent-blue-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      {/* ── Protocol details ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-7 space-y-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Protocol Details</h2>
        <Field label="Protocol Title" required>
          <textarea
            required value={protocolTitle} onChange={e => setProtocolTitle(e.target.value)}
            rows={4} className={`${inputCls} resize-none`}
          />
        </Field>
        <Field label="Protocol Description" required>
          <select required value={studyType} onChange={e => setStudyType(e.target.value)} className={inputCls}>
            <option value="">— Select —</option>
            {STUDY_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Purpose of Protocol (degree)" required>
          <select required value={degree} onChange={e => setDegree(e.target.value)} className={inputCls}>
            <option value="">— Select —</option>
            {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
      </section>

      {/* ── Files ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-7 space-y-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Files</h2>
        <label className="flex items-start gap-2.5 text-sm cursor-pointer">
          <input
            type="checkbox" required checked={fileNaming} onChange={e => setFileNaming(e.target.checked)}
            className="mt-0.5 accent-blue-600"
          />
          <span>
            The Protocol filename conforms to website requirements
            <span className="text-red-500 ml-0.5">*</span>
          </span>
        </label>
        <FileField
          ref={protocolFileRef}
          label="Protocol file" required
          accept=".doc,.docx"
          hint="One file only. 10 MB limit. Allowed types: doc, docx."
        />
        <FileField
          ref={datasheetFileRef}
          label="Datasheet file" required
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          hint="This file refers to the variable fields to be collected in the protocol. One file only. 10 MB limit. Allowed types: pdf, doc, docx, ppt, xls, xlsx."
        />
        <FileField
          ref={supplementaryFileRef}
          label="Supplementary file"
          accept=".gif,.jpg,.jpeg,.png,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
          hint="Optional. One file only. 10 MB limit."
        />
      </section>

      {/* ── Submission info ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-7 space-y-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Submission Information</h2>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Supervisor <span className="text-red-500">*</span>
          </p>
          <div className="space-y-2">
            {[
              { value: 'approved', label: 'Supervisor has read and approved protocol before submission' },
              { value: 'na',       label: 'N/A — This protocol does not have a supervisor attached' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="radio" required name="supervisor" value={opt.value}
                  checked={supervisor === opt.value} onChange={() => setSupervisor(opt.value)}
                  className="accent-blue-600"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Submission type <span className="text-red-500">*</span>
          </p>
          <div className="space-y-2">
            {['First Submission', 'Re-Submission'].map(opt => (
              <label key={opt} className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="radio" required name="subtype" value={opt}
                  checked={submissionType === opt} onChange={() => setSubmissionType(opt)}
                  className="accent-blue-600"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {submissionType === 'Re-Submission' && (
          <Field
            label="Re-Submission Protocol Number"
            hint="Enter previous protocol number (e.g. 2023/73)"
          >
            <input
              value={resubNumber} onChange={e => setResubNumber(e.target.value)}
              placeholder="e.g. 2023/73" className={inputCls}
            />
          </Field>
        )}
      </section>

      {/* ── Checklist ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-7">
        <label className="flex items-start gap-2.5 text-sm cursor-pointer">
          <input
            type="checkbox" required checked={checklist} onChange={e => setChecklist(e.target.checked)}
            className="mt-0.5 accent-blue-600"
          />
          <span>
            I have read the protocol checklist
            <span className="text-red-500 ml-0.5">*</span>
          </span>
        </label>
      </section>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit" disabled={uploading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm transition disabled:opacity-60"
      >
        {uploading ? progress || 'Submitting…' : 'Submit Protocol'}
      </button>
    </form>
    </>
  )
}
