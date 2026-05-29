import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Order the export columns sensibly rather than relying on DB column order.
const COLUMNS = [
  'serial_text', 'protocol_number', 'title', 'approved_title',
  'study_type', 'submission_type', 'degree', 'fast_tracked',
  'applicant_title', 'applicant_firstname', 'applicant_surname', 'applicant_email',
  'supervisor', 'final_outcome', 'meeting_date', 'meeting_outcome',
  'approval_date', 'amendment_date', 'list_amendments',
  'amendment_letter_status', 'approval_letter_status',
  'reviewer_comments', 'checklist', 'page_count',
  'if_resubmission_drc_number', 'year', 'year_submitted',
  'submitted_at', 'created_at', 'updated_at',
] as const

// Wrap a value for CSV: stringify, then quote + escape if it contains a comma,
// quote, or newline. Booleans/numbers become plain text; null/undefined empty.
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: protocols, error } = await supabase
    .from('protocols')
    .select(COLUMNS.join(','))
    .order('serial_text', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (protocols ?? []) as unknown as Record<string, unknown>[]
  const header = COLUMNS.join(',')
  const body = rows.map(r => COLUMNS.map(c => csvCell(r[c])).join(',')).join('\r\n')
  // Prepend a UTF-8 BOM so Excel opens accented names/text correctly.
  const csv = `﻿${header}\r\n${body}`

  const date = new Date().toISOString().split('T')[0]
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="protocols-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
