'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface FileResult {
  file: string
  status: 'inserted' | 'skipped' | 'error'
  serial_text?: string | null
  submission_id?: string | null
  surname?: string | null
  title?: string | null
  message?: string
}

export default function EmlImporter() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [queued, setQueued] = useState<File[]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<FileResult[]>([])

  function addFiles(list: FileList | null) {
    if (!list) return
    const emls = Array.from(list).filter(f => f.name.toLowerCase().endsWith('.eml'))
    setQueued(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...emls.filter(f => !names.has(f.name))]
    })
  }

  async function runImport() {
    if (queued.length === 0) return
    setImporting(true)
    setResults([])
    try {
      const fd = new FormData()
      queued.forEach(f => fd.append('files', f))
      const res = await fetch('/api/import-eml', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setResults([{ file: '—', status: 'error', message: json.error || 'Import failed' }])
      } else {
        setResults(json.results as FileResult[])
        setQueued([])
        router.refresh()
      }
    } catch (e) {
      setResults([{ file: '—', status: 'error', message: e instanceof Error ? e.message : 'Import failed' }])
    } finally {
      setImporting(false)
    }
  }

  const badge = {
    inserted: 'bg-green-100 text-green-700',
    skipped: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      {/* drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition
          ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".eml"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
        <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="mt-3 text-sm font-medium text-gray-700">
          Drag &amp; drop Drupal submission <span className="font-semibold">.eml</span> files here
        </p>
        <p className="text-xs text-gray-400 mt-1">or click to browse — multiple files supported</p>
      </div>

      {/* queue */}
      {queued.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{queued.length} file{queued.length > 1 ? 's' : ''} ready</h3>
            <button onClick={() => setQueued([])} className="text-xs text-gray-400 hover:text-red-600">Clear</button>
          </div>
          <ul className="space-y-1 mb-4 max-h-48 overflow-auto">
            {queued.map(f => (
              <li key={f.name} className="flex justify-between text-sm text-gray-600">
                <span className="truncate">{f.name}</span>
                <span className="text-gray-400 ml-2 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
              </li>
            ))}
          </ul>
          <button
            onClick={runImport}
            disabled={importing}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? 'Importing…' : `Import ${queued.length} submission${queued.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* results */}
      {results.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Results</h3>
          <ul className="space-y-2">
            {results.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium capitalize ${badge[r.status]}`}>
                  {r.status}
                </span>
                <div className="min-w-0">
                  <p className="text-gray-700 truncate">
                    {r.surname ? `${r.surname} — ` : ''}{r.file}
                    {r.serial_text && <span className="ml-2 font-mono text-blue-700">{r.serial_text}</span>}
                  </p>
                  {r.message && <p className="text-xs text-gray-400">{r.message}</p>}
                  {r.title && <p className="text-xs text-gray-400 truncate">{r.title}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
