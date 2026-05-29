"""
Append-only protocol import for the latest FileMaker extract.

Reads ~/Desktop/Untitled.tab.xlsx (25-column layout, different from the original
import-protocols.py) and writes supabase/append-protocols.sql.

The generated SQL inserts each row only if its serial_text is not already present
(INSERT ... SELECT ... WHERE NOT EXISTS), so it:
  - only ADDS new protocols (never updates/overwrites existing ones), and
  - is safe to run against the live DB and safe to re-run (idempotent).

Run:  python3 supabase/append-protocols.py
Then run the generated SQL in the Supabase SQL editor.
"""

import openpyxl
import os
import re
from datetime import datetime, date

XLSX = os.path.expanduser('~/Desktop/Untitled.tab.xlsx')
OUT  = os.path.join(os.path.dirname(__file__), 'append-protocols.sql')

# ── column indices in this extract ───────────────────────────────────────────
C_ADDL_AMEND   = 0   # Additional ammendment Comments  -> list_amendments
C_AMEND_LETTER = 1   # Amendment letter                -> amendment_letter_status
C_APPR_LETTER  = 2   # Approval letter                 -> approval_letter_status
C_APPR_TITLE   = 3   # Aproved Title                   -> approved_title
C_DEGREE       = 4   # Auto Degree                     -> degree
C_STUDY_TYPE   = 5   # Auto Protocol Description        -> study_type
C_TITLE        = 7   # Auto Protocol Title Submitted    -> title
C_SUBMISSION   = 8   # Auto Submission                 -> submission_type
C_CREATED      = 10  # created                         -> submitted_at
C_EMAIL        = 11  # Email                           -> applicant_email
C_FASTTRACK    = 12  # Fast Tracked                    -> fast_tracked
C_OUTCOME      = 13  # Final Outcome                   -> final_outcome
C_FIRSTNAME    = 14  # Firstname                       -> applicant_firstname
C_MEETING_DATE = 15  # Meeting Date                    -> meeting_date (TEXT)
C_MEETING_OUT  = 16  # Meeting outcome                 -> meeting_outcome
C_OMIT         = 17  # Omit Record                     -> omit_record
C_PROF_TITLE   = 18  # Professional Title              -> applicant_title
C_SERIAL       = 22  # Serial Text                     -> serial_text (dedupe key)
C_SURNAME      = 24  # Surname                         -> applicant_surname
# Intentionally NOT imported here:
#   [6] Auto Protocol Fast Track (duplicate of Fast Tracked)
#   [9] ComKey (always empty)
#   [19] Protocol Represented (a Yes/No flag, no matching column)
#   [20]/[21] Reviewer 1/2 (belong in protocol_assignments, keyed to profiles)
#   [23] SubmissionID (unreliable / placeholder text)

# ── value mappers ─────────────────────────────────────────────────────────────
OUTCOME_MAP = {
    'approved':         'approved',
    'minor amendment':  'minor_amendment',
    'minor ammendment': 'minor_amendment',
    'major amendment':  'major_amendment',
    'major ammendment': 'major_amendment',
    'rejected':         'rejected',
    'pending':          'pending',
    'rolled-over':      'rolled_over',
    'rolled over':      'rolled_over',
    'na':               'na',
    'n/a':              'na',
}

SUBMISSION_MAP = {
    'first':         'First Submission',
    're-submission': 'Re-Submission',
    'resubmission':  'Re-Submission',
}

# Only import protocols AFTER this serial. 2026/371 (Kathryn Manning) was the
# last row of the previous import, so we take 2026/372 onwards.
CUTOFF = (2026, 371)
_SERIAL_RE = re.compile(r'^\s*(\d{4})\s*/\s*(\d+)\s*$')

def parse_serial(s):
    """Return (year, number) for a 'YYYY/NNN' serial, else None."""
    if s is None:
        return None
    m = _SERIAL_RE.match(str(s).strip())
    return (int(m.group(1)), int(m.group(2))) if m else None

_FM_TAG = re.compile(r'^<\d+>$')

def esc(v):
    if v is None:
        return 'NULL'
    s = str(v).strip()
    if not s or s.lower() in ('none', 'n/a', 'na', '#') or _FM_TAG.match(s):
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def esc_date(v):
    """For TEXT date columns: render ISO date string (still quoted)."""
    if v is None:
        return 'NULL'
    if isinstance(v, (datetime, date)):
        d = v.date() if isinstance(v, datetime) else v
        return "'" + d.isoformat() + "'"
    s = str(v).strip()
    if not s or s.lower() in ('none', 'n/a', 'na'):
        return 'NULL'
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y'):
        try:
            return "'" + datetime.strptime(s, fmt).strftime('%Y-%m-%d') + "'"
        except ValueError:
            pass
    return 'NULL'

def esc_ts(v):
    if v is None:
        return 'NULL'
    if isinstance(v, datetime):
        return "'" + v.isoformat() + "'"
    if isinstance(v, date):
        return "'" + v.isoformat() + "'"
    s = str(v).strip()
    if not s or s.lower() in ('none', 'n/a', 'na'):
        return 'NULL'
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d'):
        try:
            return "'" + datetime.strptime(s, fmt).isoformat() + "'"
        except ValueError:
            pass
    return 'NULL'

def esc_bool(v):
    return 'TRUE' if v is not None and str(v).strip().lower() in ('yes', 'true', '1') else 'FALSE'

def map_outcome(v):
    if v is None:
        return "'pending'"
    return "'" + OUTCOME_MAP.get(str(v).strip().lower(), 'pending') + "'"

def map_submission(v):
    if v is None:
        return 'NULL'
    key = str(v).strip().lower()
    if key in SUBMISSION_MAP:
        return esc(SUBMISSION_MAP[key])
    return esc(v)

# ── load workbook ─────────────────────────────────────────────────────────────
print(f'Reading {XLSX} …')
wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
ws = wb['Sheet1']
rows = list(ws.iter_rows(values_only=True))
data = [tuple(r) + (None,) * max(0, 25 - len(r)) for r in rows[1:]]
print(f'  {len(data)} data rows')

COLUMNS = (
    'serial_text', 'title', 'approved_title', 'study_type', 'submission_type',
    'degree', 'fast_tracked', 'submitted_at', 'final_outcome', 'meeting_date',
    'meeting_outcome', 'applicant_email', 'applicant_firstname', 'applicant_surname',
    'applicant_title', 'amendment_letter_status', 'approval_letter_status',
    'list_amendments', 'omit_record'
)

stmts = []
skipped_blank = 0
skipped_before_cutoff = 0
skipped_unparseable = 0
for r in data:
    serial = str(r[C_SERIAL]).strip() if r[C_SERIAL] is not None else ''
    if not serial:
        skipped_blank += 1
        continue
    parsed = parse_serial(serial)
    if parsed is None:
        skipped_unparseable += 1
        continue
    if parsed <= CUTOFF:          # only 2026/372 onwards
        skipped_before_cutoff += 1
        continue
    serial_lit = esc(r[C_SERIAL])
    vals = [
        serial_lit,                       # serial_text
        esc(r[C_TITLE]),                  # title
        esc(r[C_APPR_TITLE]),             # approved_title
        esc(r[C_STUDY_TYPE]),             # study_type
        map_submission(r[C_SUBMISSION]),  # submission_type
        esc(r[C_DEGREE]),                 # degree
        esc_bool(r[C_FASTTRACK]),         # fast_tracked
        esc_ts(r[C_CREATED]),             # submitted_at
        map_outcome(r[C_OUTCOME]),        # final_outcome
        esc_date(r[C_MEETING_DATE]),      # meeting_date
        esc(r[C_MEETING_OUT]),            # meeting_outcome
        esc(r[C_EMAIL]),                  # applicant_email
        esc(r[C_FIRSTNAME]),              # applicant_firstname
        esc(r[C_SURNAME]),                # applicant_surname
        esc(r[C_PROF_TITLE]),             # applicant_title
        esc(r[C_AMEND_LETTER]),           # amendment_letter_status
        esc(r[C_APPR_LETTER]),            # approval_letter_status
        esc(r[C_ADDL_AMEND]),             # list_amendments
        esc_bool(r[C_OMIT]),              # omit_record
    ]
    stmt = (
        f"INSERT INTO public.protocols ({', '.join(COLUMNS)})\n"
        f"SELECT {', '.join(vals)}\n"
        f"WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = {serial_lit});"
    )
    stmts.append(stmt)

sql = (
    "-- Auto-generated APPEND-ONLY protocol import (latest FileMaker extract).\n"
    "-- Each row inserts only if its serial_text is not already present, so this\n"
    "-- never overwrites existing protocols and is safe to re-run.\n"
    "-- Run in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).\n\n"
    "BEGIN;\n\n"
    + "\n\n".join(stmts)
    + "\n\nCOMMIT;\n"
    + f"\n-- New protocols (> 2026/371): {len(stmts)}"
    + f"\n-- Skipped (<= 2026/371, already imported): {skipped_before_cutoff}"
    + f"\n-- Skipped (blank serial_text): {skipped_blank}"
    + f"\n-- Skipped (unparseable serial_text): {skipped_unparseable}\n"
)

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(sql)

print(f'Written: {OUT}')
print(f'  New protocols (> 2026/371):         {len(stmts)}')
print(f'  Skipped (<= 2026/371, prior import): {skipped_before_cutoff}')
print(f'  Skipped (blank serial_text):        {skipped_blank}')
print(f'  Skipped (unparseable serial_text):  {skipped_unparseable}')
print('\nNext: run supabase/append-protocols.sql in the Supabase SQL editor.')
print('Only serials not already in the table will be inserted.')
