"""
Reads ~/Desktop/sdrc_protocol_submission-2.csv (Drupal webform export) and writes
supabase/import-drupal-csv.sql.

Each INSERT is guarded by WHERE NOT EXISTS (submission_id = ...) so the script is
idempotent — re-running only inserts protocols not already in the DB. New rows
get their serial_text auto-assigned by the trg_auto_serial_text trigger.

Run:  python3 supabase/import-drupal-csv.py
Then paste the generated SQL into the Supabase SQL editor and run it.
"""

import csv
import os
from datetime import datetime

CSV_PATH = os.path.expanduser('~/Desktop/sdrc_protocol_submission-2.csv')
OUT_PATH = os.path.join(os.path.dirname(__file__), 'import-drupal-csv.sql')


def esc(v):
    if v is None:
        return 'NULL'
    s = str(v).strip()
    if not s or s.lower() in ('none', 'n/a', 'na'):
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"


def esc_ts(v):
    if not v:
        return 'NULL'
    s = str(v).strip()
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d'):
        try:
            return "'" + datetime.strptime(s, fmt).isoformat() + "'"
        except ValueError:
            pass
    return 'NULL'


def year_of(v):
    if not v:
        return 'NULL'
    s = str(v).strip()
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d'):
        try:
            return "'" + str(datetime.strptime(s, fmt).year) + "'"
        except ValueError:
            pass
    return 'NULL'


def fast_tracked(v):
    return 'TRUE' if v and 'fast track' in str(v).strip().lower() else 'FALSE'


COLS = [
    'submission_id', 'title', 'study_type', 'submission_type', 'degree',
    'fast_tracked', 'submitted_at', 'applicant_email', 'applicant_firstname',
    'applicant_surname', 'applicant_title', 'supervisor', 'protocol_file',
    'datasheet_file', 'supplementary_file', 'checklist', 'year',
    'year_submitted', 'if_resubmission_drc_number',
]

with open(CSV_PATH, newline='', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)  # skip header
    rows = list(reader)

# Insert in chronological order so the auto-serial trigger numbers them sensibly
rows.sort(key=lambda r: r[3] or '')

stmts = []
skipped = 0
for r in rows:
    submission_id = r[1].strip() if len(r) > 1 else ''
    if not submission_id:
        skipped += 1
        continue

    values = [
        esc(submission_id),    # submission_id
        esc(r[26]),            # title
        esc(r[31]),            # study_type
        esc(r[34]),            # submission_type
        esc(r[32]),            # degree
        fast_tracked(r[25]),   # fast_tracked
        esc_ts(r[3]),          # submitted_at (Created)
        esc(r[23]),            # applicant_email
        esc(r[21]),            # applicant_firstname
        esc(r[22]),            # applicant_surname
        esc(r[24]),            # applicant_title
        esc(r[33]),            # supervisor
        esc(r[28]),            # protocol_file
        esc(r[29]),            # datasheet_file
        esc(r[30]),            # supplementary_file
        esc(r[36]),            # checklist
        year_of(r[3]),         # year
        year_of(r[3]),         # year_submitted
        esc(r[35]),            # if_resubmission_drc_number
    ]

    stmts.append(
        f"INSERT INTO public.protocols ({', '.join(COLS)})\n"
        f"  SELECT {', '.join(values)}\n"
        f"  WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE submission_id = {esc(submission_id)});"
    )

header = """\
-- Auto-generated import from Drupal webform CSV (sdrc_protocol_submission-2.csv)
-- Idempotent: each row only inserts if its submission_id is not already present.
-- New rows get serial_text auto-assigned by trg_auto_serial_text.

"""

with open(OUT_PATH, 'w', encoding='utf-8') as f:
    f.write(header)
    f.write('\n'.join(stmts))
    f.write(f"\n\n-- {len(stmts)} INSERT statements generated, {skipped} rows skipped (no submission_id).\n")

print(f'Written: {OUT_PATH}')
print(f'  Statements: {len(stmts)}  (each skips if submission_id already exists)')
print(f'  Skipped:    {skipped}')
print()
print('Next: open Supabase SQL editor and run supabase/import-drupal-csv.sql')
