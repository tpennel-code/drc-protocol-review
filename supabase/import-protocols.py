#!/usr/bin/env python3
"""
Import protocols from FileMaker CSV export into Supabase.
Usage: python3 import-protocols.py
Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars before running.
"""

import csv
import os
import json
import urllib.request
import urllib.parse

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
CSV_PATH = os.environ.get("CSV_PATH", "/Users/timpennel/Desktop/Untitled.csv")

def supabase_insert(table, rows):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data = json.dumps(rows).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status

def parse_bool(val):
    if not val:
        return None
    return val.strip().lower() in ("yes", "true", "1")

def parse_int(val):
    try:
        return int(val.strip())
    except Exception:
        return None

def clean(val):
    if val is None:
        return None
    v = val.strip()
    return v if v else None

# Column index map (from FileMaker xlsx headers)
COL = {
    "study_type": 0,
    "protocol_number": 1,
    "reviewer_comments": 2,
    "amendment_date": 3,
    "amendment_letter_status": 4,
    "approval_letter_status": 5,
    "approval_date": 6,
    "approved_title": 7,
    "degree": 8,
    "fast_tracked": 9,
    "title": 10,
    "submission_type": 11,
    "supervisor": 12,
    "checklist": 16,
    "created_at_fm": 18,
    "datasheet_file": 19,
    "date_imported": 20,
    "applicant_email": 22,
    "final_outcome_raw": 25,
    "applicant_firstname": 26,
    "meeting_date": 27,
    "if_resubmission_drc_number": 28,
    "list_amendments": 30,
    "applicant_title": 40,
    "protocol_file": 41,
    "omit_record": 43,
    "applicant_surname": 48,
    "page_count": 38,
    "serial_text": 53,
    "submission_id": 55,
    "submitted_at": 56,
    "supplementary_file": 58,
    "year": 66,
    "year_submitted": 67,
}

OUTCOME_MAP = {
    "approved": "approved",
    "minor ammendment": "minor_amendment",
    "minor amendment": "minor_amendment",
    "major ammendment": "major_amendment",
    "major amendment": "major_amendment",
    "rejected": "rejected",
    "rolled-over": "rolled_over",
    "rolled over": "rolled_over",
    "na": "na",
    "n/a": "na",
    "": "pending",
}

def map_outcome(val):
    return OUTCOME_MAP.get((val or "").strip().lower(), "pending")

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.")
        return

    rows = []
    with open(CSV_PATH, encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 68:
                continue
            record = {
                "study_type": clean(row[COL["study_type"]]),
                "protocol_number": clean(row[COL["protocol_number"]]),
                "reviewer_comments": clean(row[COL["reviewer_comments"]]),
                "amendment_date": clean(row[COL["amendment_date"]]),
                "amendment_letter_status": clean(row[COL["amendment_letter_status"]]),
                "approval_letter_status": clean(row[COL["approval_letter_status"]]),
                "approval_date": clean(row[COL["approval_date"]]) or None,
                "approved_title": clean(row[COL["approved_title"]]),
                "degree": clean(row[COL["degree"]]),
                "fast_tracked": parse_bool(row[COL["fast_tracked"]]),
                "title": clean(row[COL["title"]]),
                "submission_type": clean(row[COL["submission_type"]]),
                "supervisor": clean(row[COL["supervisor"]]),
                "checklist": clean(row[COL["checklist"]]),
                "datasheet_file": clean(row[COL["datasheet_file"]]),
                "applicant_email": clean(row[COL["applicant_email"]]),
                "final_outcome": map_outcome(row[COL["final_outcome_raw"]]),
                "applicant_firstname": clean(row[COL["applicant_firstname"]]),
                "meeting_date": clean(row[COL["meeting_date"]]),
                "if_resubmission_drc_number": clean(row[COL["if_resubmission_drc_number"]]),
                "list_amendments": clean(row[COL["list_amendments"]]),
                "applicant_title": clean(row[COL["applicant_title"]]),
                "protocol_file": clean(row[COL["protocol_file"]]),
                "omit_record": parse_bool(row[COL["omit_record"]]) or False,
                "applicant_surname": clean(row[COL["applicant_surname"]]),
                "page_count": parse_int(row[COL["page_count"]]),
                "serial_text": clean(row[COL["serial_text"]]),
                "submission_id": clean(row[COL["submission_id"]]),
                "submitted_at": clean(row[COL["submitted_at"]]) or None,
                "supplementary_file": clean(row[COL["supplementary_file"]]),
                "year": clean(row[COL["year"]]),
                "year_submitted": clean(row[COL["year_submitted"]]),
            }
            rows.append(record)

    print(f"Parsed {len(rows)} protocols. Inserting in batches...")

    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        status = supabase_insert("protocols", batch)
        print(f"  Batch {i//batch_size + 1}: {len(batch)} rows → HTTP {status}")

    print("Done.")

if __name__ == "__main__":
    main()
