"""
Reads ~/Desktop/Untitled.xlsx and writes supabase/import-protocols.sql
Run:  python3 supabase/import-protocols.py
Then paste the generated SQL into the Supabase SQL editor and run it.
"""

import openpyxl
import os
from datetime import datetime, date

XLSX = os.path.expanduser('~/Desktop/Untitled.xlsx')
OUT  = os.path.join(os.path.dirname(__file__), 'import-protocols.sql')

# ── value mappers ────────────────────────────────────────────────────────────

OUTCOME_MAP = {
    'approved':         'approved',
    'major amendment':  'major_amendment',
    'minor amendment':  'minor_amendment',
    'minor ammendment': 'minor_amendment',
    'major ammendment': 'major_amendment',
    'pending':          'pending',
    'na':               'pending',
    'n/a':              'pending',
    'rolled-over':      'pending',
}

CLEAN_SUBMISSION = {
    'first submission': 'First Submission',
    're-submission':    'Re-Submission',
}

import re as _re
_FM_TAG = _re.compile(r'^<\d+>$')   # FileMaker portal/repeat indicators like <1>, <6>

def esc(v):
    if v is None:
        return 'NULL'
    s = str(v).strip()
    if not s or s.lower() in ('none', 'n/a', 'na', '#') or _FM_TAG.match(s):
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def esc_date(v):
    if v is None:
        return 'NULL'
    if isinstance(v, (datetime, date)):
        return "'" + (v.date() if isinstance(v, datetime) else v).isoformat() + "'"
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
    """Timestamp: keep time if present."""
    if v is None:
        return 'NULL'
    if isinstance(v, datetime):
        return "'" + v.isoformat() + "'"
    if isinstance(v, date):
        return "'" + v.isoformat() + "'"
    s = str(v).strip()
    if not s or s.lower() in ('none', 'n/a', 'na'):
        return 'NULL'
    for fmt in ('%Y-%m-%d %H:%M', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d'):
        try:
            return "'" + datetime.strptime(s, fmt).isoformat() + "'"
        except ValueError:
            pass
    return 'NULL'

def esc_bool(v):
    if v is None:
        return 'FALSE'
    return 'TRUE' if str(v).strip().lower() in ('yes', 'true', '1') else 'FALSE'

def map_outcome(v):
    if v is None:
        return "'pending'"
    key = str(v).strip().lower()
    return "'" + OUTCOME_MAP.get(key, 'pending') + "'"

def map_submission(v):
    if v is None:
        return 'NULL'
    s = str(v).strip()
    key = s.lower()
    if key in CLEAN_SUBMISSION:
        return esc(CLEAN_SUBMISSION[key])
    # Drop FileMaker portal tags and long garbage values
    if s.startswith('<') or s.startswith('>') or len(s) > 40:
        return 'NULL'
    return esc(s)

def map_title(row):
    """Protocol Title [44] first, fallback to Auto Protocol Title Submitted [10]."""
    for idx in (44, 10):
        v = str(row[idx]).strip() if row[idx] else ''
        if v and v.lower() not in ('none', 'n/a', '<1>', '<2>'):
            return esc(v)
    return 'NULL'

def map_degree(row):
    """Degree Purpose [21] first, fallback to Auto Degree [8]."""
    for idx in (21, 8):
        v = str(row[idx]).strip() if row[idx] else ''
        if v and v.lower() not in ('none', 'n/a'):
            return esc(v)
    return 'NULL'

def esc_int(v):
    try:
        return str(int(v))
    except (TypeError, ValueError):
        return 'NULL'

# ── load workbook ────────────────────────────────────────────────────────────

print(f'Reading {XLSX} …')
wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
ws = wb.active
all_rows = list(ws.iter_rows(values_only=True))
data_rows = all_rows[1:]   # skip header row
print(f'  {len(data_rows)} data rows found')

# ── build SQL ────────────────────────────────────────────────────────────────

header = """\
-- Auto-generated protocol import
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

INSERT INTO public.protocols (
  serial_text, protocol_number, title, approved_title, study_type,
  submission_type, degree, fast_tracked, submitted_at, final_outcome,
  approval_date, meeting_date, meeting_outcome,
  applicant_email, applicant_firstname, applicant_surname, applicant_title,
  supervisor, amendment_letter_status, approval_letter_status, amendment_date,
  protocol_file, datasheet_file, supplementary_file, checklist,
  submission_id, year, year_submitted, list_amendments,
  page_count, if_resubmission_drc_number, omit_record
) VALUES
"""

value_blocks = []
skipped = 0

for r in data_rows:
    r = tuple(r) + (None,) * max(0, 68 - len(r))   # pad short rows
    serial_text = str(r[53]).strip() if r[53] else ''
    email       = str(r[22]).strip() if r[22] else ''
    if not serial_text and not email:
        skipped += 1
        continue

    block = (
        "  ("
        + ", ".join([
            esc(r[53]),           # serial_text
            esc(r[50]),           # protocol_number (Serial col)
            map_title(r),         # title
            esc(r[7]),            # approved_title
            esc(r[0]),            # study_type
            map_submission(r[54]),# submission_type
            map_degree(r),        # degree
            esc_bool(r[23]),      # fast_tracked
            esc_ts(r[56]),        # submitted_at
            map_outcome(r[25]),   # final_outcome
            esc_date(r[6]),       # approval_date
            esc(r[32]),           # meeting_date
            esc(r[33]),           # meeting_outcome
            esc(r[22]),           # applicant_email
            esc(r[26]),           # applicant_firstname
            esc(r[59]),           # applicant_surname
            esc(r[40]),           # applicant_title
            esc(r[57]),           # supervisor
            esc(r[4]),            # amendment_letter_status
            esc(r[5]),            # approval_letter_status
            esc_date(r[3]),       # amendment_date
            esc(r[41]),           # protocol_file
            esc(r[19]),           # datasheet_file
            esc(r[58]),           # supplementary_file
            esc(r[16]),           # checklist
            esc(r[55]),           # submission_id
            esc(r[66]),           # year
            esc(r[67]),           # year_submitted
            esc(r[30]),           # list_amendments
            esc_int(r[38]),       # page_count
            esc(r[28]),           # if_resubmission_drc_number
            esc_bool(r[37]),      # omit_record
        ])
        + ")"
    )
    value_blocks.append(block)

sql = header + ",\n".join(value_blocks) + ";\n"
sql += f"\n-- Imported {len(value_blocks)} protocols, skipped {skipped} empty rows.\n"

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(sql)

print(f'Written: {OUT}')
print(f'  Protocols to insert: {len(value_blocks)}')
print(f'  Skipped (empty):     {skipped}')
print()
print('Next step: open the Supabase SQL editor and run import-protocols.sql')
