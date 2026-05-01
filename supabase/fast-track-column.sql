-- Add fast track decision column to protocols
-- Run in Supabase SQL editor

ALTER TABLE public.protocols
  ADD COLUMN IF NOT EXISTS fast_track_approved BOOLEAN DEFAULT NULL;

-- NULL  = awaiting executive decision (only relevant when fast_tracked = true)
-- TRUE  = fast track approved — executive reviews directly
-- FALSE = fast track rejected — sent for normal review (2 reviewers required)
