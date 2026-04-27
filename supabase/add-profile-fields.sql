-- Migration: add title, division, portfolio to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS professional_title TEXT,
  ADD COLUMN IF NOT EXISTS division TEXT,
  ADD COLUMN IF NOT EXISTS portfolio TEXT;
