-- Auto-generate DRC serial numbers in YYYY/NNN format
-- Skips generation if serial_text is already set (preserves FileMaker imports)
-- Increments from the highest existing number for the same year

CREATE OR REPLACE FUNCTION public.generate_serial_text()
RETURNS TRIGGER AS $$
DECLARE
  v_year    TEXT;
  v_max_num INTEGER;
  v_next    INTEGER;
BEGIN
  -- If a serial number was already provided (e.g. FileMaker import), leave it alone
  IF NEW.serial_text IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Derive year from submitted_at, falling back to current year
  v_year := COALESCE(
    EXTRACT(YEAR FROM NEW.submitted_at)::TEXT,
    EXTRACT(YEAR FROM NOW())::TEXT
  );

  -- Find the highest sequence number used for this year across all protocols
  SELECT COALESCE(MAX(
    CASE
      WHEN serial_text ~ ('^' || v_year || '/[0-9]+$')
      THEN SPLIT_PART(serial_text, '/', 2)::INTEGER
      ELSE 0
    END
  ), 0)
  INTO v_max_num
  FROM public.protocols;

  v_next := v_max_num + 1;

  -- Format: YYYY/NNN (minimum 3 digits, e.g. 2026/372, 2027/001)
  NEW.serial_text := v_year || '/' || LPAD(v_next::TEXT, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to protocols table
DROP TRIGGER IF EXISTS trg_auto_serial_text ON public.protocols;
CREATE TRIGGER trg_auto_serial_text
  BEFORE INSERT ON public.protocols
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_serial_text();
